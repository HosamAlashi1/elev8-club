import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { map, Observable, take } from 'rxjs';
import { DatePipe } from '@angular/common';
import { Version, Affiliate, Lead } from '../../core/models';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(private db: AngularFireDatabase) {}

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
   *  ADD – إضافة عنصر جديد
   ============================ */
  public add(path: string, data: any) {
    return this.db.list(path).push(data);
  }

  /** ===========================
   *  UPDATE – تحديث عنصر
   ============================ */
  public update(path: string, key: string, data: any) {
    return this.db.object(`${path}/${key}`).update(data);
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
  public getAffiliateByCode(code: string): Observable<Affiliate | null> {
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
          return items.length > 0 ? items[0] : null;
        }),
        take(1)
      );
  }

  /** جلب جميع الأفلييت */
  public getAllAffiliates(): Observable<Affiliate[]> {
    return this.list('affiliates').pipe(take(1));
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
  public addLead(lead: Omit<Lead, 'key'>): Promise<string> {
    const leadData: Lead = {
      ...lead,
      step: 1,
      consent: true,
      createdAt: new Date().toISOString()
    };
    
    return this.db.list('leads').push(leadData).then(ref => {
      const leadKey = ref.key || '';
      // حفظ الـ key داخل الـ object
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

  /** جلب جميع Leads لنسخة معينة */
  public getLeadsByVersion(versionKey: string): Observable<Lead[]> {
    return this.list('leads', 'versionKey', versionKey).pipe(take(1));
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
        // نحتاج نجيب الليدز لكل أفلييت
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
}
