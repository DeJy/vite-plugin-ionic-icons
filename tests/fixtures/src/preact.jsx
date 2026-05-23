// Preact h() fixture
// Detected icons: heart
import { h } from 'preact';

export function LikeButton() {
  return h('button', null,
    h('ion-icon', { name: 'heart' }),
    'Like',
  );
}
