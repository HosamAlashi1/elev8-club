export interface PortalNotification {
  id: number;
  title: string;
  message: string;
  link?: string;
  target_id?: number;
  target_type?: number;
  is_read: boolean;
  insert_date: string;
}

export interface NotificationListResponse {
  total_count: number;
  total_records: number;
  data: PortalNotification[];
}
