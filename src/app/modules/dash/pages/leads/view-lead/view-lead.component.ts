
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Lead } from '../../../../../core/models';

interface LeadWithAffiliate extends Lead {
  affiliateName?: string;
  affiliateCode?: string;
  assigned_sales?: {
    sales_id: string;
    whatsapp_number: string;
    assigned_at: number;
    assigned_via: string;
  };
  salesName?: string;
}

@Component({
  selector: 'app-view-lead',
  templateUrl: './view-lead.component.html',
  styleUrls: ['./view-lead.component.css']
})
export class ViewLeadComponent implements OnInit {
  @Input() lead!: LeadWithAffiliate;

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {}

  getCreatedDate(): string {
    return new Date(this.lead.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCompletedDate(): string {
    if (!this.lead.completedAt) return 'N/A';
    return new Date(this.lead.completedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getGoalLabel(goal?: string): string {
    const goals: { [key: string]: string } = {
      ready_trades: 'Ready Trades',
      trading_bot: 'Trading Bot',
      learn_trading: 'Learn Trading',
      steady_income: 'Steady Income'
    };
    return goal ? goals[goal] || goal : 'N/A';
  }

  getExperienceLabel(level?: string): string {
    if (!level) return 'N/A';
    return level.charAt(0).toUpperCase() + level.slice(1);
  }

  getInitial(): string {
    const name = this.lead?.fullName;
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }

  getStatusLabel(): string {
    return this.lead.step === 2 ? 'Completed' : 'Pending';
  }

  getStatusClass(): string {
    return this.lead.step === 2 ? 'status-pill completed' : 'status-pill pending';
  }

  getAssignedDate(): string {
    if (!this.lead.assigned_sales?.assigned_at) return 'N/A';
    return new Date(this.lead.assigned_sales.assigned_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  hasAssignedSales(): boolean {
    return !!this.lead.assigned_sales;
  }
}
