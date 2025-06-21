import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "ข้อผิดพลาด 404: ผู้ใช้พยายามเข้าถึงเส้นทางที่ไม่มีอยู่:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">อุ๊ปส์! ไม่พบหน้านี้</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          กลับสู่หน้าหลัก
        </a>
      </div>
    </div>
  );
};

export default NotFound;