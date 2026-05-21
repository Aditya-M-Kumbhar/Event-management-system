import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

export default function MainLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-[--color-bg]">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
