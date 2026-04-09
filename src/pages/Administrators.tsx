import { Navigate } from 'react-router-dom';

// หน้าผู้บริหารถูกรวมเข้ากับหน้าบุคลากร
const Administrators = () => <Navigate to="/staff" replace />;

export default Administrators;
