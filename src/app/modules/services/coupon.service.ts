import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { map, Observable } from 'rxjs';
import { Coupon } from '../../core/models';

/** Reads and writes `coupons/{CODE}` (admin-only in the database rules). */
@Injectable({ providedIn: 'root' })
export class CouponService {
  constructor(private db: AngularFireDatabase, private auth: AngularFireAuth) {}

  list(): Observable<Coupon[]> {
    return this.db.list<Coupon>('coupons').snapshotChanges().pipe(
      map(rows => rows
        .map(r => ({ ...(r.payload.val() as Coupon), code: r.payload.key || '' }))
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')))
    );
  }

  /**
   * Creates each coupon only if its code is free (a transaction, so an existing coupon — and its
   * usage count — can never be overwritten). Returns what was created and which codes were taken.
   */
  async create(input: Omit<Coupon, 'createdAt' | 'usedCount' | 'createdBy'>[]): Promise<{ created: string[]; taken: string[] }> {
    const user = await this.auth.currentUser;
    const created: string[] = [];
    const taken: string[] = [];
    for (const c of input) {
      const record: Coupon = {
        ...c,
        usedCount: 0,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid || ''
      };
      const result = await this.db.database.ref(`coupons/${c.code}`)
        .transaction(current => current === null ? record : undefined);
      (result.committed ? created : taken).push(c.code);
    }
    return { created, taken };
  }

  setActive(code: string, isActive: boolean): Promise<void> {
    return this.db.object(`coupons/${code}`).update({ isActive });
  }

  remove(code: string): Promise<void> {
    return this.db.object(`coupons/${code}`).remove();
  }
}
