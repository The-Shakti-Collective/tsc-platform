import { redirect } from 'next/navigation';
import { siteConfig } from '@/lib/config';

export default function ApplyPage() {
  redirect(siteConfig.applyUrl);
}
