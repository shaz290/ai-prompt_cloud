import { Routes, Route } from "react-router-dom";
import { Home } from "@/pages/Home";
import { Upload } from "@/pages/Upload";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/upload" element={<Upload />} />
    </Routes>
  );
}

export default App;
