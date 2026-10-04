const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="h-full w-full bg-gradient-to-b from-white via-sky-50 to-sky-200">
            {children}
        </div>
    )
}
export default AuthLayout;