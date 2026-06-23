import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { map, Observable, take } from 'rxjs';
import { DatePipe } from '@angular/common';
import { Version, Affiliate, Lead, SalesMember, CallLog, DashboardUser } from '../../core/models';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(private db: AngularFireDatabase) { }

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
        }),
        take(1)
      );
  }

  /** جلب جميع النسخ */
  public getAllVersions(): Observable<Version[]> {
    return this.list('versions').pipe(take(1));
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
    return this.list('affiliates').pipe(take(1));
  }

  /** جلب جميع الأفلييتس لنسخة معينة */
  public getAffiliatesByVersion(versionKey: string): Observable<Affiliate[]> {
    return this.getAllAffiliates().pipe(
      map(affiliates => affiliates.filter(affiliate => affiliate.versionKey === versionKey)),
      take(1)
    );
  }

  // ==========================================
  // Sales helpers
  // ==========================================

  public getAllSales(): Observable<any[]> {
    return this.list('sales').pipe(take(1));
  }

  public getSalesByVersion(versionKey: string): Observable<any[]> {
    return this.getAllSales().pipe(
      map(sales => sales.filter(item => item.versionKey === versionKey)),
      take(1)
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
  public addAffiliate(data: Omit<Affiliate, 'key' | 'createdAt'>): Promise<any> {
    const affiliateData = {
      ...data,
      createdAt: new Date().toISOString()
    };
    return this.db.list('affiliates').push(affiliateData).then(ref => {
      return this.db.object(`affiliates/${ref.key}`).update({ key: ref.key });
    });
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
        map(lead => lead || null),
        take(1)
      );
  }

  public getAffiliateByKey(key: string): Observable<Affiliate | null> {
    return this.db.object<Affiliate>(`affiliates/${key}`).valueChanges().pipe(map(a => a || null), take(1));
  }

  public getSalesMemberByKey(key: string): Observable<SalesMember | null> {
    return this.db.object<SalesMember>(`sales_members/${key}`).valueChanges().pipe(map(m => m || null), take(1));
  }

  /** جلب جميع Leads لنسخة معينة */
  public getLeadsByVersion(versionKey: string): Observable<Lead[]> {
    return this.list('leads', 'versionKey', versionKey);
  }

  /** جلب Leads لأفلييت معين */
  public getLeadsByAffiliate(affiliateKey: string): Observable<Lead[]> {
    return this.list('leads', 'affiliateKey', affiliateKey).pipe(take(1));
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
        map(user => user || null),
        take(1)
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

  public updateLeadSalesStatus(leadKey: string, status: string): Promise<void> {
    return this.db.object(`leads/${leadKey}`).update({ sales_status: status });
  }

  public updateLeadAffiliateStatus(leadKey: string, status: string): Promise<void> {
    return this.db.object(`leads/${leadKey}`).update({ affiliate_status: status });
  }

  public assignSalesMemberToLead(leadKey: string, salesMemberKey: string): Promise<void> {
    return this.db.object(`leads/${leadKey}`).update({
      salesMemberKey,
      sales_status: 'new'
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
      ),
      take(1)
    );
  }

  public getClosedLeadsByVersion(versionKey: string): Observable<Lead[]> {
    return this.db.list<Lead>('leads', ref =>
      ref.orderByChild('versionKey').equalTo(versionKey)
    ).snapshotChanges().pipe(
      map(changes => changes
        .map(c => ({ ...(c.payload.val() as Lead), key: c.payload.key || '' }))
        .filter(l => l.sales_status === 'closed')
      ),
      take(1)
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
