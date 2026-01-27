import { Outlet } from "react-router-dom";

export const Layout = () => {
    return (
        <>
            {/* HEADER */}
            <header className="p-4 border-b">
                <h1 className="font-bold">My App</h1>
            </header>

            {/* PAGE CONTENT */}
            <main>
                <Outlet />
            </main>

            {/* FOOTER */}
            <footer className="p-4 border-t text-center text-sm">
                © 2026
            </footer>
        </>
    );
};
