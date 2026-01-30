import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export const Layout = () => {
    return (
        <>
            {/* GLOBAL NAVBAR */}
            <Navbar />

            {/* PAGE CONTENT */}
            <main className="pt-24">
                <Outlet />
            </main>

            {/* GLOBAL FOOTER */}
            <Footer />
        </>
    );
};
