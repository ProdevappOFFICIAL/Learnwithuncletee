const SettingsLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="  animate-in fade-in slide-in-from-bottom-2 duration-500 selection:bg-blue-100 h-full">

            {children}
        </div>
    );
};

export default SettingsLayout;