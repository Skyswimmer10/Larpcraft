import React, { useSyncExternalStore } from 'react';
import { getStorageStatus, subscribeStorageStatus, retryLocalSaves } from '../state/storage.js';
export default function StorageStatus() {
  const status = useSyncExternalStore(subscribeStorageStatus, getStorageStatus);
  const error = status.startsWith('Local save needs attention:');
  return <span className={`storage-status${error ? ' error' : ''}`} role="status" title={status}>
    {error ? <details><summary>Local save needs attention</summary><p>{status}</p><p>Your draft is retained in this browser and, when reachable, in local browser-backups. Export it from File before reconciling a conflict.</p><button onClick={retryLocalSaves}>Retry saving</button></details> : status}
  </span>;
}
