/** يُعاد إنشاؤه عند كل تنقّل بين الصفحات، فتتحرك الصفحة الجديدة بنعومة. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
