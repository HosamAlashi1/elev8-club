import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { combineLatest, firstValueFrom, map, Observable, take } from 'rxjs';
import { DatePipe } from '@angular/common';
import {
  Version, Affiliate, Lead, SalesMember, CallLog, DashboardUser,
  SalesPackage, SalesStatus, RenewalCycle, RenewalStatus
} from '../../core/models';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(
    private db: AngularFireDatabase,
    private fns: AngularFireFunctions,
    private auth: AngularFireAuth
  ) { }

  /** =======================
   *  LIST – جلب قائمة كاملة
   *  Optional: فلترة بقيمة
   ======================== */
  public list(path: string, key?: string, value?: any): Observable<any[]> {
    const ref = key
      ? this.db.list(path, r => r.orderByChild(key).equalTo(value))
      : this.db.list(path);

    return ref.snapshotChanges().pipe(
      map(changes =>
        changes.map(c => ({
          key: c.payload.key,
          ...(c.payload.val() as object)
        }))
      )
    );
  }

  /** ===========================
   *  GET – جلب عنصر محدد بالبحث
   ============================ */
  public get(path: string, key: string, value: any): Observable<any | null> {
    return this.db.list(path, ref => ref.orderByChild(key).equalTo(value))
      .snapshotChanges()
      .pipe(
        map(changes => {
          const items = changes.map(c => ({
            key: c.payload.key,
            ...(c.payload.val() as object)
          }));
          return items.length > 0 ? items[0] : null;
        })
      );
  }

  /** ===========================
   *  GET OBJECT – جلب كائن واحد ثابت
   *  مثل /settings أو /sales/meta
   ============================ */
  public getObject(path: string): Observable<any | null> {
    return this.db.object(path).valueChanges();
  }

  /** ===========================
   *  ADD – إضافة عنصر جديد
   ============================ */
  public add(path: string, data: any) {
    return this.db.list(path).push(data);
  }

  /** ===========================
   *  UPDATE – تحديث عنصر داخل list
   *  مثال: update('affiliates', affiliateKey, data)
   ============================ */
  public update(path: string, key: string, data: any) {
    return this.db.object(`${path}/${key}`).update(data);
  }

  /** ===========================
   *  UPDATE OBJECT – تحديث كائن واحد
   *  مثال: updateObject('settings', data)
   ============================ */
  public updateObject(path: string, data: any) {
    return this.db.object(path).update(data);
  }

  /** ===========================
   *  DELETE – حذف عنصر
   ============================ */
  public delete(path: string, key: string) {
    return this.db.object(`${path}/${key}`).remove();
  }

  /** =======================================
   *  ACTIVATE – تغيير قيمة isActive فقط
   ======================================== */
  public activate(path: string, key: string, status: boolean) {
    return this.db.object(`${path}/${key}`).update({ isActive: status });
  }

  /** ======================================
   *  COUNT – عدّ عناصر بناءً على قيمة
   ======================================= */
  public count(path: string, key: string, value: any): Observable<number> {
    return this.db.list(path, ref => ref.orderByChild(key).equalTo(value))
      .snapshotChanges()
      .pipe(map(changes => changes.length));
  }

  /** ======================================
   *  TIMESTAMP تحويل توقيت إلى تاريخ
   ======================================= */
  public timestampToDate(timestamp: any): string | null {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return new DatePipe('en-US').transform(date, 'MMM dd yyyy') || '';
  }

  /** ======================================
   *  LIST WITH KEYS – جلب raw snapshot
   ======================================= */
  public listWithKeys(path: string) {
    return this.db.list(path).snapshotChanges();
  }

  // ==========================================
  // دوال متخصصة للـ Versions
  // ==========================================

  /** جلب النسخة الحالية النشطة */
  public getCurrentVersion(): Observable<Version | null> {
    return this.db.list<Version>('versions', ref => ref.orderByChild('isCurrent').equalTo(true))
      .snapshotChanges()
      .pipe(
        map(changes => {
          const items = changes.map(c => {
            const val = c.payload.val() as Version;
            return {
              ...val,
              key: c.payload.key || val.key || ''
            };
          });
          return items.length > 0 ? items[0] : null;
        })
      );
  }

  /** جلب جميع النسخ */
  public getAllVersions(): Observable<Version[]> {
    return this.list('versions');
  }

  /** إضافة نسخة جديدة */
  public addVersion(name: string): Promise<any> {
    const versionData: Partial<Version> = {
      name,
      isCurrent: false,
      createdAt: new Date().toISOString()
    };
    return this.db.list('versions').push(versionData).then(ref => {
      // حفظ الـ key داخل الـ object نفسه
      return this.db.object(`versions/${ref.key}`).update({ key: ref.key });
    });
  }

  /** تفعيل نسخة معينة كنسخة حالية */
  public setCurrentVersion(versionKey: string): Promise<void> {
    // أولاً: نلغي تفعيل جميع النسخ
    return this.db.list('versions')
      .snapshotChanges()
      .pipe(take(1))
      .toPromise()
      .then(versions => {
        const updates: any = {};
        versions?.forEach(v => {
          updates[`versions/${v.key}/isCurrent`] = false;
        });
        // ثانياً: نفعّل النسخة المطلوبة
        updates[`versions/${versionKey}/isCurrent`] = true;
        return this.db.object('/').update(updates);
      });
  }

  // ==========================================
  // دوال متخصصة للـ Affiliates
  // ==========================================

  /** جلب أفلييت بناءً على الكود */
  public getAffiliateByCode(code: string, versionKey?: string): Observable<Affiliate | null> {
    return this.db.list<Affiliate>('affiliates', ref => ref.orderByChild('code').equalTo(code))
      .snapshotChanges()
      .pipe(
        map(changes => {
          const items = changes.map(c => {
            const val = c.payload.val() as Affiliate;
            return {
              ...val,
              key: c.payload.key || val.key || ''
            };
          });
          const filteredItems = versionKey
            ? items.filter(item => item.versionKey === versionKey)
            : items;
          return filteredItems.length > 0 ? filteredItems[0] : null;
        }),
        take(1)
      );
  }

  /** جلب جميع الأفلييت */
  public getAllAffiliates(): Observable<Affiliate[]> {
    return this.list('affiliates');
  }

  /** جلب جميع الأفلييتس لنسخة معينة */
  public getAffiliatesByVersion(versionKey: string): Observable<Affiliate[]> {
    return this.getAllAffiliates().pipe(
      map(affiliates => affiliates.filter(affiliate => affiliate.versionKey === versionKey))
    );
  }

  // ==========================================
  // Sales helpers
  // ==========================================

  public getAllSales(): Observable<any[]> {
    return this.list('sales');
  }

  public getSalesByVersion(versionKey: string): Observable<any[]> {
    return this.getAllSales().pipe(
      map(sales => sales.filter(item => item.versionKey === versionKey))
    );
  }

  public incrementSalesCounter(salesKey: string, assignedAt: number, limit: number = 1000): Promise<void> {
    return this.db.database.ref(`sales/${salesKey}`).transaction((current: any) => {
      if (!current) return current;

      const counter = Number(current.counter) || 0;
      if (counter >= limit) return;

      return {
        ...current,
        counter: counter + 1,
        last_assigned_at: assignedAt
      };
    }).then(result => {
      if (!result.committed) {
        throw new Error('WhatsApp group is full or unavailable');
      }
    });
  }

  /** إضافة أفلييت جديد */
  public async addAffiliate(data: Omit<Affiliate, 'key' | 'createdAt'>): Promise<string> {
    const accountManagerKey = data.versionKey
      ? await this.assignNextAccountManager(data.versionKey)
      : null;
    if (!accountManagerKey) {
      throw new Error('Create an active account manager before adding an affiliate');
    }
    const now = new Date().toISOString();
    const affiliateData = {
      ...data,
      createdAt: now,
      accountManagerKey,
      accountManagerAssignedAt: Date.now()
    };
    const ref = await this.db.list('affiliates').push(affiliateData);
    const key = ref.key || '';
    await this.db.object(`affiliates/${key}`).update({ key });
    return key;
  }

  // ==========================================
  // دوال متخصصة للـ Leads
  // ==========================================

  /** إضافة Lead جديد (الخطوة الأولى) */
  public addLead(lead: any): Promise<string> {
    return this.db.list('leads').push(lead).then(ref => {
      const leadKey = ref.key || '';
      return this.db.object(`leads/${leadKey}`).update({ key: leadKey }).then(() => leadKey);
    });
  }

  /** تحديث Lead بإجابات الأسئلة (الخطوة الثانية) */
  public completeLead(leadKey: string, answers: any, country?: string, city?: string): Promise<void> {
    const updateData: any = {
      answers,
      step: 2,
      completedAt: new Date().toISOString()
    };

    if (country) updateData.country = country;
    if (city) updateData.city = city;

    return this.db.object(`leads/${leadKey}`).update(updateData);
  }

  /** جلب Lead بناءً على الـ key */
  public getLeadByKey(leadKey: string): Observable<Lead | null> {
    return this.db.object<Lead>(`leads/${leadKey}`)
      .valueChanges()
      .pipe(
        map(lead => lead || null)
      );
  }

  public getAffiliateByKey(key: string): Observable<Affiliate | null> {
    return this.db.object<Affiliate>(`affiliates/${key}`).valueChanges().pipe(map(a => a || null));
  }

  public getSalesMemberByKey(key: string): Observable<SalesMember | null> {
    return this.db.object<SalesMember>(`sales_members/${key}`).valueChanges().pipe(map(m => m || null));
  }

  /** جلب جميع Leads لنسخة معينة */
  public getLeadsByVersion(versionKey: string): Observable<Lead[]> {
    return this.list('leads', 'versionKey', versionKey);
  }

  /** جلب Leads لأفلييت معين */
  public getLeadsByAffiliate(affiliateKey: string): Observable<Lead[]> {
    return this.list('leads', 'affiliateKey', affiliateKey);
  }

  /** جلب Leads لنسخة + أفلييت معين */
  public getLeadsByVersionAndAffiliate(versionKey: string, affiliateCode: string): Observable<Lead[]> {
    return this.db.list<Lead>('leads', ref =>
      ref.orderByChild('versionKey').equalTo(versionKey)
    )
      .snapshotChanges()
      .pipe(
        map(changes => {
          const items = changes.map(c => {
            const val = c.payload.val() as Lead;
            return {
              ...val,
              key: c.payload.key || val.key || ''
            };
          });
          // فلترة إضافية على الأفلييت
          return items.filter(item => item.affiliateCode === affiliateCode);
        })
      );
  }

  /** عدّ Leads حسب step معين */
  public countLeadsByStep(step: 1 | 2): Observable<number> {
    return this.count('leads', 'step', step);
  }

  // ==========================================
  // دوال الإحصائيات والتقارير
  // ==========================================

  /** عد Leads لنسخة معينة حسب step (إذا لم يتم تحديد step، يتم حساب الكل) */
  public countLeadsByVersionAndStep(versionKey: string, step?: 1 | 2): Observable<number> {
    return this.db.list<Lead>('leads', ref =>
      ref.orderByChild('versionKey').equalTo(versionKey)
    )
      .snapshotChanges()
      .pipe(
        map(changes => {
          const items = changes.map(c => c.payload.val() as Lead);
          // إذا تم تحديد step، فلتر حسبه، وإلا احسب الكل
          return step ? items.filter(item => item.step === step).length : items.length;
        })
      );
  }

  /** إحصائيات Affiliate (عدد Leads + Completed) */
  public getAffiliateStats(affiliateKey: string, versionKey: string): Observable<{ total: number, completed: number }> {
    return this.getLeadsByVersionAndAffiliate(versionKey, affiliateKey).pipe(
      map(leads => ({
        total: leads.length,
        completed: leads.filter(l => l.step === 2).length
      }))
    );
  }

  /** جلب Top Affiliates بالإحصائيات */
  public getTopAffiliates(versionKey: string, limit: number = 5): Observable<any[]> {
    return this.getAllAffiliates().pipe(
      map(affiliates => {
        // نحتاج نجيب الليدز لكل أفلييت (لاحقاً)
        return affiliates.map(aff => ({
          ...aff,
          leadsCount: 0,
          completedCount: 0
        }));
      })
    );
  }

  /** جلب Leads per day للشهر الأخير */
  public getLeadsPerDay(versionKey: string, days: number = 30): Observable<{ date: string, count: number }[]> {
    return this.getLeadsByVersion(versionKey).pipe(
      map(leads => {
        const dateMap: { [key: string]: number } = {};
        const today = new Date();

        // Initialize last N days
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          dateMap[dateStr] = 0;
        }

        // Count leads per day
        leads.forEach(lead => {
          if (lead.createdAt) {
            const dateStr = lead.createdAt.split('T')[0];
            if (dateMap.hasOwnProperty(dateStr)) {
              dateMap[dateStr]++;
            }
          }
        });

        return Object.entries(dateMap).map(([date, count]) => ({ date, count }));
      })
    );
  }

  /** تحديث Affiliate */
  public updateAffiliate(affiliateKey: string, data: Partial<Affiliate>): Promise<void> {
    return this.db.object(`affiliates/${affiliateKey}`).update(data);
  }

  /** حذف Affiliate */
  public deleteAffiliate(affiliateKey: string): Promise<void> {
    return this.db.object(`affiliates/${affiliateKey}`).remove();
  }

  // ==========================================
  // Dashboard Users (roles)
  // ==========================================

  public getDashboardUser(uid: string): Observable<DashboardUser | null> {
    return this.db.object<DashboardUser>(`dashboard_users/${uid}`)
      .valueChanges()
      .pipe(
        map(user => user || null)
      );
  }

  public createDashboardUser(uid: string, data: Omit<DashboardUser, 'uid'>): Promise<void> {
    return this.db.object(`dashboard_users/${uid}`).set({ ...data, uid });
  }

  public updateDashboardUser(uid: string, data: Partial<DashboardUser>): Promise<void> {
    return this.db.object(`dashboard_users/${uid}`).update(data);
  }

  public getAllDashboardUsers(): Observable<DashboardUser[]> {
    return this.db.list<DashboardUser>('dashboard_users')
      .snapshotChanges()
      .pipe(
        map(changes => changes.map(c => ({
          ...(c.payload.val() as DashboardUser),
          uid: c.payload.key || ''
        })))
      );
  }

  private async ensureAuthenticatedFunctionCall(): Promise<void> {
    const user = await this.auth.currentUser;
    if (!user) {
      throw new Error('Your session has expired. Please sign in again.');
    }

    // Ensure AngularFire Functions can attach a fresh Firebase ID token.
    await user.getIdToken(true);
  }

  public async createDashboardAuthUser(data: {
    email: string;
    password: string;
    name: string;
    role: 'account_manager' | 'affiliate';
    versionKey?: string;
    affiliateKey?: string;
  }): Promise<{ uid: string }> {
    await this.ensureAuthenticatedFunctionCall();
    const result = await firstValueFrom(
      this.fns.httpsCallable('createDashboardUser')(data)
    ) as { uid?: string } | undefined;
    if (!result?.uid) throw new Error('Failed to create dashboard user');
    return { uid: result.uid };
  }

  public async updateDashboardAuthUser(data: {
    uid: string;
    email?: string;
    password?: string;
    name?: string;
    isActive?: boolean;
  }): Promise<void> {
    await this.ensureAuthenticatedFunctionCall();
    await firstValueFrom(this.fns.httpsCallable('updateDashboardUserAuth')(data));
  }

  public getActiveAccountManagersByVersion(versionKey: string): Observable<DashboardUser[]> {
    return this.getAllDashboardUsers().pipe(
      map(users => users.filter(user =>
        user.role === 'account_manager' &&
        user.isActive &&
        (!user.versionKey || user.versionKey === versionKey)
      ))
    );
  }

  /** Round-robin: assign the least recently assigned active account manager. */
  public assignNextAccountManager(versionKey: string): Promise<string | null> {
    return this.getActiveAccountManagersByVersion(versionKey).pipe(take(1)).toPromise()
      .then(managers => {
        if (!managers?.length) return null;
        const sorted = [...managers].sort((a, b) => {
          if (!a.last_assigned_at && !b.last_assigned_at) return 0;
          if (!a.last_assigned_at) return -1;
          if (!b.last_assigned_at) return 1;
          return a.last_assigned_at - b.last_assigned_at;
        });
        const chosen = sorted[0];
        return this.db.object(`dashboard_users/${chosen.uid}`).update({
          last_assigned_at: Date.now()
        }).then(() => chosen.uid);
      });
  }

  public getAffiliatesByAccountManager(accountManagerKey: string): Observable<Affiliate[]> {
    return combineLatest([
      this.getAllAffiliates(),
      this.getDashboardUser(accountManagerKey)
    ]).pipe(
      map(([affiliates, manager]) => affiliates.filter(affiliate =>
        affiliate.accountManagerKey === accountManagerKey ||
        (!!manager?.affiliateKey && affiliate.key === manager.affiliateKey)
      ))
    );
  }

  // ==========================================
  // Sales Members
  // ==========================================

  public getAllSalesMembers(): Observable<SalesMember[]> {
    return this.list('sales_members');
  }

  public getSalesMembersByVersion(versionKey: string): Observable<SalesMember[]> {
    return this.list('sales_members').pipe(
      map(members => members.filter((m: SalesMember) => m.versionKey === versionKey))
    );
  }

  public getActiveSalesMembersByVersion(versionKey: string): Observable<SalesMember[]> {
    return this.getSalesMembersByVersion(versionKey).pipe(
      map(members => members.filter((m: SalesMember) => m.isActive))
    );
  }

  public addSalesMember(data: Omit<SalesMember, 'key' | 'createdAt'>): Promise<string> {
    const memberData = { ...data, createdAt: new Date().toISOString() };
    return this.db.list('sales_members').push(memberData).then(ref => {
      const key = ref.key || '';
      return this.db.object(`sales_members/${key}`).update({ key }).then(() => key);
    });
  }

  public updateSalesMember(key: string, data: Partial<SalesMember>): Promise<void> {
    return this.db.object(`sales_members/${key}`).update(data);
  }

  public deleteSalesMember(key: string): Promise<void> {
    return this.db.object(`sales_members/${key}`).remove();
  }

  /** Round-robin: assign next active sales member for a version */
  public assignNextSalesMember(versionKey: string): Promise<string | null> {
    return this.getActiveSalesMembersByVersion(versionKey).pipe(take(1)).toPromise()
      .then(members => {
        if (!members || members.length === 0) return null;

        // Sort: null last_assigned_at first, then ascending by timestamp
        const sorted = [...members].sort((a, b) => {
          if (!a.last_assigned_at && !b.last_assigned_at) return 0;
          if (!a.last_assigned_at) return -1;
          if (!b.last_assigned_at) return 1;
          return a.last_assigned_at - b.last_assigned_at;
        });

        const chosen = sorted[0];
        const now = Date.now();

        return this.db.object(`sales_members/${chosen.key}`).update({ last_assigned_at: now })
          .then(() => chosen.key || null);
      });
  }

  // ==========================================
  // Lead Sales Status
  // ==========================================

  public updateLeadSalesStatus(
    leadKey: string,
    status: SalesStatus,
    salesPackage?: SalesPackage
  ): Promise<void> {
    if (status === 'closed' && !salesPackage) {
      return Promise.reject(new Error('A package is required when closing a lead'));
    }

    return this.db.object(`leads/${leadKey}`).update({
      sales_status: status,
      sales_package: status === 'closed' ? salesPackage : null
    });
  }

  public updateLeadAffiliateStatus(leadKey: string, status: string): Promise<void> {
    return this.db.object(`leads/${leadKey}`).update({ affiliate_status: status });
  }

  public getRenewalCycles(leadKey: string): Observable<RenewalCycle[]> {
    return this.db.list<RenewalCycle>(`lead_renewals/${leadKey}`)
      .snapshotChanges()
      .pipe(
        map(changes => changes
          .map(change => ({
            ...(change.payload.val() as RenewalCycle),
            key: change.payload.key || ''
          }))
          .sort((a, b) => a.cycleNumber - b.cycleNumber)
        )
      );
  }

  public async createRenewalCycle(
    lead: Lead,
    cycleNumber: number,
    createdBy: string
  ): Promise<RenewalCycle> {
    if (!lead.key) throw new Error('Lead key is required');
    const now = new Date().toISOString();
    const data: Omit<RenewalCycle, 'key'> = {
      leadKey: lead.key,
      versionKey: lead.versionKey,
      cycleNumber,
      status: 'renewal_followup',
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      createdBy
    };
    const ref = await this.db.list(`lead_renewals/${lead.key}`).push(data);
    const key = ref.key || '';
    await Promise.all([
      this.db.object(`lead_renewals/${lead.key}/${key}`).update({ key }),
      this.db.object(`leads/${lead.key}`).update({
        current_renewal_cycle_key: key,
        renewal_status: 'renewal_followup',
        renewal_package: null,
        affiliate_status: 'renewal_followup'
      })
    ]);
    return { ...data, key };
  }

  public async ensureInitialRenewalCycle(lead: Lead, createdBy: string): Promise<RenewalCycle> {
    if (!lead.key) throw new Error('Lead key is required');
    const existing = await this.getRenewalCycles(lead.key).pipe(take(1)).toPromise();
    if (existing?.length) return existing[existing.length - 1];

    const now = new Date().toISOString();
    const status = lead.renewal_status || lead.affiliate_status || 'renewal_followup';
    const renewalCount = lead.renewal_count ?? (status === 'renewed' ? 1 : 0);
    const data: Omit<RenewalCycle, 'key'> = {
      leadKey: lead.key,
      versionKey: lead.versionKey,
      cycleNumber: Math.max(1, renewalCount || 1),
      status,
      createdAt: now,
      updatedAt: now,
      resolvedAt: status === 'renewal_followup' ? null : now,
      createdBy
    };
    if (status === 'renewed' && lead.renewal_package) data.package = lead.renewal_package;
    const ref = await this.db.list(`lead_renewals/${lead.key}`).push(data);
    const key = ref.key || '';
    await Promise.all([
      this.db.object(`lead_renewals/${lead.key}/${key}`).update({ key }),
      this.db.object(`leads/${lead.key}`).update({
        current_renewal_cycle_key: key,
        renewal_status: status,
        renewal_package: status === 'renewed' ? lead.renewal_package || null : null,
        renewal_count: renewalCount,
        affiliate_status: status
      })
    ]);
    return { ...data, key };
  }

  public async updateRenewalCycleStatus(
    lead: Lead,
    cycle: RenewalCycle,
    status: RenewalStatus,
    salesPackage?: SalesPackage
  ): Promise<void> {
    if (!lead.key || !cycle.key) throw new Error('Lead and renewal cycle are required');
    if (status === 'renewed' && !salesPackage) {
      throw new Error('A package is required for renewed leads');
    }

    const wasRenewed = cycle.status === 'renewed';
    const willBeRenewed = status === 'renewed';
    const currentCount = lead.renewal_count ?? (lead.affiliate_status === 'renewed' ? 1 : 0);
    const renewalCount = Math.max(0, currentCount + (willBeRenewed ? 1 : 0) - (wasRenewed ? 1 : 0));
    const now = new Date().toISOString();
    const isResolved = status !== 'renewal_followup';

    await Promise.all([
      this.db.object(`lead_renewals/${lead.key}/${cycle.key}`).update({
        status,
        package: status === 'renewed' ? salesPackage : null,
        updatedAt: now,
        resolvedAt: isResolved ? now : null
      }),
      this.db.object(`leads/${lead.key}`).update({
        renewal_status: status,
        renewal_package: status === 'renewed' ? salesPackage : null,
        renewal_count: renewalCount,
        current_renewal_cycle_key: cycle.key,
        affiliate_status: status
      })
    ]);
  }

  public async addRenewalCall(
    leadKey: string,
    cycle: RenewalCycle,
    data: Omit<CallLog, 'key' | 'createdAt' | 'renewalCycleKey' | 'renewalCycleNumber'>
  ): Promise<string> {
    const logs = await this.getCallLogs(leadKey).pipe(take(1)).toPromise();
    const cycleCalls = (logs || []).filter(log =>
      log.renewalCycleKey === cycle.key ||
      (cycle.cycleNumber === 1 && log.type === 'affiliate' && !log.renewalCycleKey)
    );
    if (cycleCalls.length >= 4) throw new Error('Maximum of 4 calls reached for this renewal follow-up');
    return this.addCallLog(leadKey, {
      ...data,
      type: 'renewal',
      renewalCycleKey: cycle.key,
      renewalCycleNumber: cycle.cycleNumber
    });
  }

  public assignSalesMemberToLead(leadKey: string, salesMemberKey: string): Promise<void> {
    return this.db.object(`leads/${leadKey}`).update({
      salesMemberKey,
      sales_status: 'new',
      sales_package: null
    });
  }

  public getLeadsBySalesMember(salesMemberKey: string): Observable<Lead[]> {
    return this.db.list<Lead>('leads', ref =>
      ref.orderByChild('salesMemberKey').equalTo(salesMemberKey)
    ).snapshotChanges().pipe(
      map(changes => changes.map(c => ({
        ...(c.payload.val() as Lead),
        key: c.payload.key || ''
      })))
    );
  }

  public getClosedLeadsByAffiliate(affiliateKey: string): Observable<Lead[]> {
    return this.db.list<Lead>('leads', ref =>
      ref.orderByChild('affiliateKey').equalTo(affiliateKey)
    ).snapshotChanges().pipe(
      map(changes => changes
        .map(c => ({ ...(c.payload.val() as Lead), key: c.payload.key || '' }))
        .filter(l => l.sales_status === 'closed')
      )
    );
  }

  public getClosedLeadsByVersion(versionKey: string): Observable<Lead[]> {
    return this.db.list<Lead>('leads', ref =>
      ref.orderByChild('versionKey').equalTo(versionKey)
    ).snapshotChanges().pipe(
      map(changes => changes
        .map(c => ({ ...(c.payload.val() as Lead), key: c.payload.key || '' }))
        .filter(l => l.sales_status === 'closed')
      )
    );
  }

  // ==========================================
  // Call Logs
  // ==========================================

  public addCallLog(leadKey: string, data: Omit<CallLog, 'key' | 'createdAt'>): Promise<string> {
    const logData = { ...data, createdAt: new Date().toISOString() };
    return this.db.list(`lead_calls/${leadKey}`).push(logData).then(ref => {
      const key = ref.key || '';
      return this.db.object(`lead_calls/${leadKey}/${key}`).update({ key }).then(() => key);
    });
  }

  public getCallLogs(leadKey: string): Observable<CallLog[]> {
    return this.db.list<CallLog>(`lead_calls/${leadKey}`)
      .snapshotChanges()
      .pipe(
        map(changes => changes
          .map(c => ({ ...(c.payload.val() as CallLog), key: c.payload.key || '' }))
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        )
      );
  }

  public deleteCallLog(leadKey: string, callKey: string): Promise<void> {
    return this.db.object(`lead_calls/${leadKey}/${callKey}`).remove();
  }

  public updateCallLog(leadKey: string, callKey: string, data: Partial<CallLog>): Promise<void> {
    return this.db.object(`lead_calls/${leadKey}/${callKey}`).update(data);
  }

}
