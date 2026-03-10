import { useAuth } from "../../hooks/useAuth"

export default function Topbar() {

  const { user, logout } = useAuth()

  return (

    <div
      style={{
        height: 60,
        borderBottom: "1px solid #eee",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px"
      }}
    >

      <b>Admin Panel</b>

      <div>

        {user?.name} ({user?.role})

        <button
          style={{ marginLeft: 10 }}
          onClick={logout}
        >
          Logout
        </button>

      </div>

    </div>
  )
}