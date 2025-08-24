import { useNavigate } from 'react-router-dom';
import { FaPiggyBank } from 'react-icons/fa';

function Home() {
  const navigate = useNavigate();

  return (
    <div className='bord'>
      <FaPiggyBank className="app-logo" />
      <h1>MoneyTracker</h1>
      <button onClick={() => navigate('/login')}>Cliquer ici</button>
    </div>
  );
}

export default Home;