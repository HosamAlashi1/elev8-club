import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

interface AffiliateWithStats {
  key: string;
  name: string;
  email: string;
  code: string;
  whatsappNumber?: string;
  createdAt: number;
  leadsCount: number;
  completedCount: number;
}

@Component({
  selector: 'app-view-affiliate',
  templateUrl: './view-affiliate.component.html',
  styleUrls: ['./view-affiliate.component.css']
})
export class ViewAffiliateComponent implements OnInit {
  @Input() affiliate!: AffiliateWithStats;
  affiliateLink = '';
  linkCopied = false;

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    if (this.affiliate) {
      this.affiliateLink = `${window.location.origin}/home?ref=${this.affiliate.code}`;
    }
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.affiliateLink).then(() => {
      this.linkCopied = true;
      setTimeout(() => (this.linkCopied = false), 1200);
    });
  }

  getCreatedDate(): string {
    return new Date(this.affiliate.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getPending(): number {
    return Math.max(this.affiliate.leadsCount - this.affiliate.completedCount, 0);
  }

  getInitial(): string {
    return this.affiliate?.name?.trim()?.charAt(0)?.toUpperCase() || '?';
  }
}
