import axios from 'axios';

export const MAIL_TEMPLATE_IMAGE_UPLOADER = 'mailTemplateImageUploader';

export const buildInlineImageTag = (url, alt = '') => {
  const safeUrl = String(url || '').trim();
  if (!safeUrl) return '';
  const safeAlt = String(alt || '').replace(/"/g, '&quot;');
  return `<img src="${safeUrl}" alt="${safeAlt}" style="display:block;max-width:100%;height:auto;border:0;" />`;
};

export const insertHtmlAtTextareaCursor = (textarea, html) => {
  if (!textarea || !html) return '';
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? start;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  const next = `${before}${html}${after}`;
  textarea.value = next;
  const cursor = start + html.length;
  textarea.selectionStart = cursor;
  textarea.selectionEnd = cursor;
  textarea.focus();
  return next;
};

export const insertImageInQuill = (quill, url) => {
  if (!quill || !url) return;
  const range = quill.getSelection(true);
  const index = range?.index ?? quill.getLength();
  quill.insertEmbed(index, 'image', url, 'user');
  quill.setSelection(index + 1, 0, 'user');
};

export const uploadMailTemplateImage = async (file) => {
  if (!file) throw new Error('No image selected');

  const formData = new FormData();
  formData.append('file', file);

  const res = await axios.post('/api/mail/templates/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'x-skip-toast': 'true',
    },
    withCredentials: true,
    timeout: 0,
  });

  const uploaded = res.data?.data;
  const url = uploaded?.url;
  if (!url) throw new Error(res.data?.message || 'Image upload failed');

  return {
    url,
    name: uploaded?.name || file.name,
    uploadedAt: new Date().toISOString(),
  };
};
