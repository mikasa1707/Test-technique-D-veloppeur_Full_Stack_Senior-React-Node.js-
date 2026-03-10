import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
// import Topbar from "./Topbar"

export default function AdminLayout() {

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      <Sidebar />

      <div style={{ flex: 1 }}>

        {/* <Topbar /> */}

        <div style={{ padding: 20 }}>
          <Outlet />
        </div>

      </div>

    </div>
  )
}