// React / JSX / TSX fixture
// Detected icons: add-outline, trash, home (via createElement)
import React from 'react';

export function MyComponent() {
  return (
    <div>
      {/* Static JSX attribute */}
      <ion-icon name="add-outline" />

      {/* Other attributes before name */}
      <ion-icon size="small" name="trash" />

      {/* Duplicate — scanner must deduplicate */}
      <ion-icon name="add-outline" />

      {/* React.createElement hyperscript */}
      {React.createElement('ion-icon', { name: 'home' })}
    </div>
  );
}
