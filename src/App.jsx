import { Routes, Route } from "react-router-dom";
import { Layout } from "./layout/Layout";
import { Home } from "./pages/Home";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { Upload } from "./pages/Upload";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";

function App() {
  return (
    <Routes>
      {/* PAGES WITH NAVBAR + FOOTER */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Route>

      {/* PAGES WITHOUT NAVBAR */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/upload" element={<Upload />} />
    </Routes>
  );
}

export default App;
