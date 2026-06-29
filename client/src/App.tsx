// App 主组件
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import ContentList from './pages/ContentList';
import ContentDetail from './pages/ContentDetail';
import PracticePage from './pages/PracticePage';
import ReadAloudPage from './pages/ReadAloudPage';
import ErrorBook from './pages/ErrorBook';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* 练习页面使用独立布局，不显示顶部导航 */}
            <Route path="/practice/:id" element={<PracticePage />} />
            <Route path="/read/:id" element={<ReadAloudPage />} />
            
            {/* 登录注册页面使用独立布局 */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* 其他页面使用标准布局 */}
            <Route
              path="*"
              element={
                <>
                  <Header />
                  <main>
                    <Routes>
                      <Route path="/" element={<ContentList />} />
                      <Route path="/content/:id" element={<ContentDetail />} />
                      <Route path="/errors" element={<ErrorBook />} />
                      <Route path="/profile" element={<Profile />} />
                    </Routes>
                  </main>
                </>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
