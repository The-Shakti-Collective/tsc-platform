import React from 'react';
import { Link } from 'react-router-dom';
import PostCollaborationForm from '../../components/collaboration/PostCollaborationForm';

export default function PostCollaborationPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link
        to="/collaborations"
        className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)]"
      >
        ← Back to marketplace
      </Link>
      <PostCollaborationForm />
    </div>
  );
}
