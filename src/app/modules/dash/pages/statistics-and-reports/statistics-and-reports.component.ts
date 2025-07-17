import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-statistics-and-reports',
  templateUrl: './statistics-and-reports.component.html',
  styleUrls: ['./statistics-and-reports.component.css']
})
export class StatisticsAndReportsComponent implements OnInit {

  reportData: any[] = []; 

  constructor() { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.reportData = [
      { name: 'Burger King', orders: 120, revenue: 1300 },
      { name: 'Pizza Hub', orders: 95, revenue: 1100 },
      { name: 'Taco World', orders: 80, revenue: 900 },
      { name: 'Sushi Bar', orders: 70, revenue: 850 },
      { name: 'Pasta House', orders: 50, revenue: 600 }
    ];
  }

  exportToExcel(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.reportData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, 'statistics-report.xlsx');
  }

  printReport(): void {
    window.print();
  }
}
