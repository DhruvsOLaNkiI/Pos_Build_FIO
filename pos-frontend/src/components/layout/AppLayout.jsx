import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';

const AppLayout = () => {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-background">
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AppLayout;
