import { redirect } from 'next/navigation';

// The alert queue is the app's main view.
export default function Home() {
  redirect('/alerts');
}
