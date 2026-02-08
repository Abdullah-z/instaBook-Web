import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { FeedProvider } from "./context/FeedContext";
import { SocketProvider } from "./context/SocketContext";
import { VoiceCallProvider } from "./context/VoiceCallContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import EditPost from "./pages/EditPost";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import Map from "./pages/Map";
import Marketplace from "./pages/Marketplace";
import ListingDetail from "./pages/ListingDetail";
import CreateListing from "./pages/CreateListing";
import MyListings from "./pages/MyListings";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import CreateEvent from "./pages/CreateEvent";
import MyEvents from "./pages/MyEvents";
import UserPostMap from "./pages/UserPostMap";
import Reels from "./pages/Reels";

const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  return token ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile/:id"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      <Route
        path="/post/:id"
        element={
          <PrivateRoute>
            <PostDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/edit-post/:id"
        element={
          <PrivateRoute>
            <EditPost />
          </PrivateRoute>
        }
      />
      <Route
        path="/search"
        element={
          <PrivateRoute>
            <Search />
          </PrivateRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <PrivateRoute>
            <Notifications />
          </PrivateRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <PrivateRoute>
            <Messages />
          </PrivateRoute>
        }
      />
      <Route
        path="/map"
        element={
          <PrivateRoute>
            <Map />
          </PrivateRoute>
        }
      />
      <Route
        path="/marketplace"
        element={
          <PrivateRoute>
            <Marketplace />
          </PrivateRoute>
        }
      />
      <Route
        path="/listing/:id"
        element={
          <PrivateRoute>
            <ListingDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/create-listing"
        element={
          <PrivateRoute>
            <CreateListing />
          </PrivateRoute>
        }
      />
      <Route
        path="/edit-listing/:id"
        element={
          <PrivateRoute>
            <CreateListing />
          </PrivateRoute>
        }
      />
      <Route
        path="/my-listings"
        element={
          <PrivateRoute>
            <MyListings />
          </PrivateRoute>
        }
      />
      <Route
        path="/events"
        element={
          <PrivateRoute>
            <Events />
          </PrivateRoute>
        }
      />
      <Route
        path="/create-event"
        element={
          <PrivateRoute>
            <CreateEvent />
          </PrivateRoute>
        }
      />
      <Route
        path="/edit-event/:id"
        element={
          <PrivateRoute>
            <CreateEvent />
          </PrivateRoute>
        }
      />
      <Route
        path="/my-events"
        element={
          <PrivateRoute>
            <MyEvents />
          </PrivateRoute>
        }
      />
      <Route
        path="/event/:id"
        element={
          <PrivateRoute>
            <EventDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/user_map/:id"
        element={
          <PrivateRoute>
            <UserPostMap />
          </PrivateRoute>
        }
      />
      <Route
        path="/reels"
        element={
          <PrivateRoute>
            <Reels />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

import CallOverlay from "./components/CallOverlay";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <FeedProvider>
            <SocketProvider>
              <VoiceCallProvider>
                <AppRoutes />
                <CallOverlay />
                <ToastContainer
                  position="bottom-right"
                  autoClose={3000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="dark"
                />
              </VoiceCallProvider>
            </SocketProvider>
          </FeedProvider>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
