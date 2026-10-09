import { getGuestWebDataAction } from '@/app/actions';
import ClientGuestWeb from './ClientGuestWeb';
import { notFound } from 'next/navigation';

export default async function TenantBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getGuestWebDataAction(slug);
  
  if (!data) {
    // If tenant not found, return 404 or show initial demo data
    // For this app, let's just use initial data if not found
    return <ClientGuestWeb initialData={null} />;
  }
  
  return <ClientGuestWeb initialData={data} />;
}
