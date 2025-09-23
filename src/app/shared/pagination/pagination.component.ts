import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  imports: [CommonModule],
})
export class PaginationComponent implements OnInit {
  @Input() currentPage = 1;
  @Input() totalItems = 0;
  @Input() itemsPerPage = 10;

  @Output() pageChange = new EventEmitter<number>();

  ngOnInit() {
    // Component initialized
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }
}
