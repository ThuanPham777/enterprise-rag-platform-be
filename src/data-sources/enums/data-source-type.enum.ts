export enum DataSourceType {
  // External integrations
  NOTION = 'NOTION',
  SLACK = 'SLACK',
  GOOGLE_DRIVE = 'GOOGLE_DRIVE',
  CONFLUENCE = 'CONFLUENCE',
  SHAREPOINT = 'SHAREPOINT',
  DROPBOX = 'DROPBOX',

  // Custom API integrations
  CUSTOM_API = 'CUSTOM_API',
}

export enum DataSourceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SYNCING = 'SYNCING',
  ERROR = 'ERROR',
  PENDING_AUTH = 'PENDING_AUTH',
}
