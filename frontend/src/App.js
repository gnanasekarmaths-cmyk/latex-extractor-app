import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import About from "./pages/About";
import Features from "./pages/Features";
import Services from "./pages/Services";
import Contact from "./pages/Contact";

function App() {
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return (
    <BrowserRouter>
      <div className={`app-shell ${theme === "light" ? "light-mode" : ""}`}>
        <Header theme={theme} toggleTheme={toggleTheme} />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/app"
              element={
                <Home
                  file={file}
                  setFile={setFile}
                  fileId={fileId}
                  setFileId={setFileId}
                  uploading={uploading}
                  setUploading={setUploading}
                />
              }
            />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
