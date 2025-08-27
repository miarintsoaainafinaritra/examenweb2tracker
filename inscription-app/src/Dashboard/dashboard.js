/* eslint-disable no-template-curly-in-string */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faChartPie, faReceipt,
  faWallet, faTags, faDownload,
  faTag, faEdit, faTrash, faBell, faPaperclip, faEye,
  faExchangeAlt, faMoneyBillWave, faSun, faMoon,
  faUser, faKey, faEnvelope, faCalendar, faSearch,
  faChartBar, faFilter, faCog, faShieldAlt, faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import { FaPiggyBank } from 'react-icons/fa';
// Custom debounce hook
const useDebounce = (callback, delay) => {
  const [timeoutId, setTimeoutId] = useState(null);
  return useCallback((...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => callback(...args), delay);
    setTimeoutId(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeoutId, delay]);
};
const dateUtils = {
  isDateInRange: (date, startDate, endDate = null) => {
    const checkDate = new Date(date);
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    return checkDate >= start && (!end || checkDate <= end);
  },
  generateRecurringOccurrences: (expense, year, month) => {
    if (expense.type !== 'Recurrente') return [];
    const startDate = new Date(expense.startDate);
    const endDate = expense.endDate ? new Date(expense.endDate) : null;
    const targetDate = new Date(year, month, 1);
    if ((endDate && endDate < targetDate) || startDate > new Date(year, month + 1, 0)) {
      return [];
    }
    const occurrenceDate = new Date(year, month, startDate.getDate());
    if (occurrenceDate < startDate || (endDate && occurrenceDate > endDate)) {
      return [];
    }
    return [{
      ...expense,
      calculatedDate: occurrenceDate.toISOString().split('T')[0],
      calculatedAmount: parseFloat(expense.amount)
    }];
  },
  getMonthYearFromDate: (dateString) => {
    const date = new Date(dateString);
    return {
      month: date.getMonth(),
      year: date.getFullYear()
    };
  },
  convertToRecurring: (expense) => {
    const expenseDate = new Date(expense.date);
    return {
      ...expense,
      type: 'Recurrente',
      startDate: expense.date,
      date: '',
      endDate: ''
    };
  },
  convertToSingle: (expense) => {
    return {
      ...expense,
      type: 'Ponctuelle',
      date: expense.startDate || new Date().toISOString().split('T')[0],
      startDate: '',
      endDate: ''
    };
  }
};
const fileUtils = {
  fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  },
  extractBase64Data: (base64String) => {
    const commaIndex = base64String.indexOf(',');
    return commaIndex !== -1 ? base64String.substring(commaIndex + 1) : base64String;
  },
  downloadFile: (base64Data, fileName, mimeType) => {
    try {
      const pureBase64 = fileUtils.extractBase64Data(base64Data);
      const byteCharacters = atob(pureBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement du fichier');
    }
  },
  openFileInNewTab: (base64Data, mimeType) => {
    try {
      const pureBase64 = fileUtils.extractBase64Data(base64Data);
      const byteCharacters = atob(pureBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du fichier:', error);
      alert('Impossible d\'ouvrir le fichier');
    }
  },
  getMimeTypeFromBase64: (base64String) => {
    const match = base64String.match(/^(.*?);base64,/);
    return match ? match[1] : 'application/octet-stream';
  },
  getFileNameFromBase64: (base64Data, originalName = '') => {
    if (originalName) return originalName;
    const mimeType = fileUtils.getMimeTypeFromBase64(base64Data);
    const extension = mimeType.includes('pdf') ? 'pdf' : 
                     mimeType.includes('jpeg') ? 'jpg' : 
                     mimeType.includes('png') ? 'png' : 'bin';
    return `receipt_${Date.now()}.${extension}`;
  }
};
const DEFAULT_CATEGORIES = ['Alimentation', 'Transport', 'Logement', 'Loisirs', 'Santé', 'Autre'];
const DEFAULT_SOURCES = ['Salaire', 'Freelance', 'Investissement', 'Cadeau', 'Autre'];
const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [sources, setSources] = useState(DEFAULT_SOURCES);
  const [showForm, setShowForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingIncome, setEditingIncome] = useState(null);
  const [filter, setFilter] = useState({ category: '', type: '' });
  const [incomeFilter, setIncomeFilter] = useState({ source: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [darkMode, setDarkMode] = useState(false);
  const [userProfile, setUserProfile] = useState({
    email: 'user@example.com',
    createdAt: new Date().toISOString(),
    passwordChanged: null,
    firstName: 'Utilisateur',
    lastName: 'Test',
    phone: '',
    notificationPreferences: {
      email: true,
      push: false,
      summary: true
    }
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [dashboardFilters, setDashboardFilters] = useState({
    category: '',
    type: '',
    startDate: '',
    endDate: ''
  });
  const [showDashboardFilters, setShowDashboardFilters] = useState(false);
  // Load data from localStorage with error handling
  useEffect(() => {
    const loadFromLocalStorage = () => {
      try {
        const savedExpenses = localStorage.getItem('expenses');
        if (savedExpenses) {
          const parsedExpenses = JSON.parse(savedExpenses);
          if (Array.isArray(parsedExpenses)) setExpenses(parsedExpenses);
        }
        const savedIncomes = localStorage.getItem('incomes');
        if (savedIncomes) {
          const parsedIncomes = JSON.parse(savedIncomes);
          if (Array.isArray(parsedIncomes)) setIncomes(parsedIncomes);
        }
        const savedCategories = localStorage.getItem('categories');
        if (savedCategories) {
          const parsedCategories = JSON.parse(savedCategories);
          if (Array.isArray(parsedCategories)) setCategories(parsedCategories);
        }
        const savedSources = localStorage.getItem('sources');
        if (savedSources) {
          const parsedSources = JSON.parse(savedSources);
          if (Array.isArray(parsedSources)) setSources(parsedSources);
        }
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode) {
          const parsedDarkMode = JSON.parse(savedDarkMode);
          if (typeof parsedDarkMode === 'boolean') setDarkMode(parsedDarkMode);
        }
        const savedUserProfile = localStorage.getItem('userProfile');
        if (savedUserProfile) {
          const parsedProfile = JSON.parse(savedUserProfile);
          if (parsedProfile && typeof parsedProfile === 'object') {
            setUserProfile(parsedProfile);
            setProfileForm({
              firstName: parsedProfile.firstName || '',
              lastName: parsedProfile.lastName || '',
              email: parsedProfile.email || '',
              phone: parsedProfile.phone || ''
            });
          } else {
            throw new Error('Invalid userProfile data');
          }
        } else {
          const defaultProfile = {
            email: 'user@example.com',
            createdAt: new Date().toISOString(),
            passwordChanged: null,
            firstName: 'Utilisateur',
            lastName: 'Test',
            phone: '',
            notificationPreferences: {
              email: true,
              push: false,
              summary: true
            }
          };
          setUserProfile(defaultProfile);
          setProfileForm({
            firstName: 'Utilisateur',
            lastName: 'Test',
            email: 'user@example.com',
            phone: ''
          });
          localStorage.setItem('userProfile', JSON.stringify(defaultProfile));
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        alert('Erreur lors du chargement des données. Les valeurs par défaut seront utilisées.');
      }
    };
    loadFromLocalStorage();
  }, []);
  // Debounced function to save to localStorage
  const saveToLocalStorage = useDebounce(() => {
    try {
      localStorage.setItem('expenses', JSON.stringify(expenses));
      localStorage.setItem('incomes', JSON.stringify(incomes));
      localStorage.setItem('categories', JSON.stringify(categories));
      localStorage.setItem('sources', JSON.stringify(sources));
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      alert('Erreur lors de la sauvegarde des données.');
    }
  }, 500);
  // Save to localStorage when states change
  useEffect(() => {
    saveToLocalStorage();
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [expenses, incomes, categories, sources, darkMode, userProfile, saveToLocalStorage]);
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  const handleSaveExpense = async (expenseData) => {
    let processedData = { ...expenseData };
    if (expenseData.receipt && expenseData.receipt instanceof File) {
      try {
        const base64Data = await fileUtils.fileToBase64(expenseData.receipt);
        processedData = {
          ...processedData,
          receipt: base64Data,
          receiptName: expenseData.receipt.name,
          receiptType: expenseData.receipt.type
        };
      } catch (error) {
        console.error('Erreur lors de la conversion du fichier:', error);
        alert('Erreur lors du traitement du fichier');
        return;
      }
    }
    if (editingExpense) {
      setExpenses(expenses.map(exp => 
        exp.id === editingExpense.id ? { ...processedData, id: exp.id } : exp
      ));
    } else {
      const newExpense = {
        ...processedData,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      setExpenses([...expenses, newExpense]);
    }
    setShowForm(false);
    setEditingExpense(null);
  };
  const handleSaveIncome = (incomeData) => {
    if (editingIncome) {
      setIncomes(incomes.map(inc => 
        inc.id === editingIncome.id ? { ...incomeData, id: inc.id } : inc
      ));
    } else {
      const newIncome = {
        ...incomeData,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      setIncomes([...incomes, newIncome]);
    }
    setShowIncomeForm(false);
    setEditingIncome(null);
  };
  const handleDownloadReceipt = (expense) => {
    if (!expense.receipt) {
      alert('Aucun reçu disponible pour cette dépense');
      return;
    }
    const fileName = fileUtils.getFileNameFromBase64(expense.receipt, expense.receiptName);
    const mimeType = expense.receiptType || fileUtils.getMimeTypeFromBase64(expense.receipt);
    fileUtils.downloadFile(expense.receipt, fileName, mimeType);
  };
  const handleViewReceipt = (expense) => {
    if (!expense.receipt) {
      alert('Aucun reçu disponible pour cette dépense');
      return;
    }
    const mimeType = expense.receiptType || fileUtils.getMimeTypeFromBase64(expense.receipt);
    fileUtils.openFileInNewTab(expense.receipt, mimeType);
  };
  const handleDeleteExpense = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      setExpenses(expenses.filter(exp => exp.id !== id));
    }
  };
  const handleDeleteIncome = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce revenu ?')) {
      setIncomes(incomes.filter(inc => inc.id !== id));
    }
  };
  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };
  const handleEditIncome = (income) => {
    setEditingIncome(income);
    setShowIncomeForm(true);
  };
  const handleConvertExpense = (expense) => {
    if (window.confirm(`Êtes-vous sûr de vouloir convertir cette dépense en ${expense.type === 'Ponctuelle' ? 'récurrente' : 'ponctuelle'} ?`)) {
      const convertedExpense = expense.type === 'Ponctuelle' 
        ? dateUtils.convertToRecurring(expense)
        : dateUtils.convertToSingle(expense);
      setExpenses(expenses.map(exp => 
        exp.id === expense.id ? convertedExpense : exp
      ));
    }
  };
  const handleAddCategory = (categoryName) => {
    if (categoryName.trim() && !categories.includes(categoryName.trim())) {
      setCategories([...categories, categoryName.trim()]);
    }
  };
  const handleEditCategory = (oldName, newName) => {
    if (newName.trim() && !categories.includes(newName.trim())) {
      const updatedCategories = categories.map(cat => 
        cat === oldName ? newName.trim() : cat
      );
      setCategories(updatedCategories);
      setExpenses(expenses.map(exp => 
        exp.category === oldName ? { ...exp, category: newName.trim() } : exp
      ));
    }
  };
  const handleDeleteCategory = (categoryName) => {
    const isUsed = expenses.some(exp => exp.category === categoryName);
    if (isUsed) {
      alert('Impossible de supprimer cette catégorie car elle est utilisée dans des dépenses.');
      return;
    }
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ?`)) {
      setCategories(categories.filter(cat => cat !== categoryName));
    }
  };
  const handleAddSource = (sourceName) => {
    if (sourceName.trim() && !sources.includes(sourceName.trim())) {
      setSources([...sources, sourceName.trim()]);
    }
  };
  const handleEditSource = (oldName, newName) => {
    if (newName.trim() && !sources.includes(newName.trim())) {
      const updatedSources = sources.map(src => 
        src === oldName ? newName.trim() : src
      );
      setSources(updatedSources);
      setIncomes(incomes.map(inc => 
        inc.source === oldName ? { ...inc, source: newName.trim() } : inc
      ));
    }
  };
  const handleDeleteSource = (sourceName) => {
    const isUsed = incomes.some(inc => inc.source === sourceName);
    if (isUsed) {
      alert('Impossible de supprimer cette source car elle est utilisée dans des revenus.');
      return;
    }
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la source "${sourceName}" ?`)) {
      setSources(sources.filter(src => src !== sourceName));
    }
  };
  const getExpensesForPeriod = (year, month, startDate = null, endDate = null) => {
    const periodExpenses = [];
    expenses.forEach(expense => {
      if (expense.type === 'Ponctuelle') {
        const expenseDate = new Date(expense.date);
        if (startDate && endDate) {
          if (expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate)) {
            periodExpenses.push({
              ...expense,
              calculatedDate: expense.date,
              calculatedAmount: parseFloat(expense.amount)
            });
          }
        } else {
          if (expenseDate.getMonth() === month && expenseDate.getFullYear() === year) {
            periodExpenses.push({
              ...expense,
              calculatedDate: expense.date,
              calculatedAmount: parseFloat(expense.amount)
            });
          }
        }
      } else if (expense.type === 'Recurrente') {
        const occurrences = dateUtils.generateRecurringOccurrences(expense, year, month);
        periodExpenses.push(...occurrences);
      }
    });
    return periodExpenses;
  };
  const getIncomesForPeriod = (year, month, startDate = null, endDate = null) => {
    return incomes.filter(income => {
      const incomeDate = new Date(income.date);
      if (startDate && endDate) {
        return incomeDate >= new Date(startDate) && incomeDate <= new Date(endDate);
      } else {
        return incomeDate.getMonth() === month && incomeDate.getFullYear() === year;
      }
    });
  };
  const getExpensesForCurrentMonth = () => {
    const monthExpenses = [];
    expenses.forEach(expense => {
      if (expense.type === 'Ponctuelle') {
        const expenseDate = new Date(expense.date);
        if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
          monthExpenses.push({
            ...expense,
            calculatedDate: expense.date,
            calculatedAmount: parseFloat(expense.amount)
          });
        }
      } else if (expense.type === 'Recurrente') {
        const occurrences = dateUtils.generateRecurringOccurrences(expense, currentYear, currentMonth);
        monthExpenses.push(...occurrences);
      }
    });
    return monthExpenses;
  };
  const getIncomesForCurrentMonth = () => {
    return incomes.filter(income => {
      const incomeDate = new Date(income.date);
      return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
    });
  };
  const filteredExpenses = expenses.filter(expense => {
    if (filter.category && expense.category !== filter.category) return false;
    if (filter.type && expense.type !== filter.type) return false;
    if (expense.type === 'Recurrente') {
      const today = new Date();
      const startDate = new Date(expense.startDate);
      if (startDate > today) return false;
      if (expense.endDate) {
        const endDate = new Date(expense.endDate);
        if (endDate < today) return false;
      }
    }
    return true;
  });
  const filteredIncomes = incomes.filter(income => {
    if (incomeFilter.source && income.source !== incomeFilter.source) return false;
    return true;
  });
  const currentMonthExpenses = getExpensesForCurrentMonth();
  const currentMonthIncomes = getIncomesForCurrentMonth();
  const totalMonthExpenses = currentMonthExpenses.reduce((total, expense) => total + expense.calculatedAmount, 0);
  const totalMonthIncomes = currentMonthIncomes.reduce((total, income) => total + parseFloat(income.amount), 0);
  const balance = totalMonthIncomes - totalMonthExpenses;
  const getTopCategory = () => {
    const categoryTotals = {};
    currentMonthExpenses.forEach(expense => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0;
      }
      categoryTotals[expense.category] += expense.calculatedAmount;
    });
    let topCategory = '';
    let maxAmount = 0;
    Object.keys(categoryTotals).forEach(category => {
      if (categoryTotals[category] > maxAmount) {
        maxAmount = categoryTotals[category];
        topCategory = category;
      }
    });
    return topCategory;
  };
  const getTopSource = () => {
    const sourceTotals = {};
    currentMonthIncomes.forEach(income => {
      if (!sourceTotals[income.source]) {
        sourceTotals[income.source] = 0;
      }
      sourceTotals[income.source] += parseFloat(income.amount);
    });
    let topSource = '';
    let maxAmount = 0;
    Object.keys(sourceTotals).forEach(source => {
      if (sourceTotals[source] > maxAmount) {
        maxAmount = sourceTotals[source];
        topSource = source;
      }
    });
    return topSource;
  };
  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Mot de passe actuel requis';
    }
    if (!passwordData.newPassword) {
      errors.newPassword = 'Nouveau mot de passe requis';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Veuillez confirmer le mot de passe';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (validatePasswordForm()) {
      setUserProfile({
        ...userProfile,
        passwordChanged: new Date().toISOString()
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      alert('Mot de passe mis à jour avec succès !');
    }
  };
  const validateProfileForm = () => {
    const errors = {};
    if (!profileForm.firstName.trim()) {
      errors.firstName = 'Le prénom est requis';
    }
    if (!profileForm.lastName.trim()) {
      errors.lastName = 'Le nom est requis';
    }
    if (!profileForm.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      errors.email = 'Format d\'email invalide';
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (validateProfileForm()) {
      setUserProfile({
        ...userProfile,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phone: profileForm.phone
      });
      alert('Profil mis à jour avec succès !');
    }
  };
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setUserProfile({
      ...userProfile,
      notificationPreferences: {
        ...userProfile.notificationPreferences,
        [name]: checked
      }
    });
  };
  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      // In a real app, this would clear authentication tokens
      alert('Déconnexion réussie');
    }
  };
  const getDashboardData = () => {
    const { startDate, endDate, category, type } = dashboardFilters;
    let expensesForPeriod;
    let incomesForPeriod;
    if (startDate && endDate) {
      // Use custom date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const year = start.getFullYear();
      const month = start.getMonth();
      expensesForPeriod = getExpensesForPeriod(year, month, startDate, endDate);
      incomesForPeriod = getIncomesForPeriod(year, month, startDate, endDate);
    } else {
      // Use current month
      expensesForPeriod = getExpensesForCurrentMonth();
      incomesForPeriod = getIncomesForCurrentMonth();
    }
    // Apply category and type filters
    if (category) {
      expensesForPeriod = expensesForPeriod.filter(exp => exp.category === category);
    }
    if (type) {
      expensesForPeriod = expensesForPeriod.filter(exp => exp.type === type);
    }
    const totalExpenses = expensesForPeriod.reduce((total, exp) => total + exp.calculatedAmount, 0);
    const totalIncomes = incomesForPeriod.reduce((total, inc) => total + parseFloat(inc.amount), 0);
    const balance = totalIncomes - totalExpenses;
    // Calculate category distribution
    const categoryData = {};
    expensesForPeriod.forEach(expense => {
      if (!categoryData[expense.category]) {
        categoryData[expense.category] = 0;
      }
      categoryData[expense.category] += expense.calculatedAmount;
    });
    // Calculate monthly trend (last 6 months)
    const monthlyData = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthExpenses = getExpensesForPeriod(year, month);
      const monthTotal = monthExpenses.reduce((total, exp) => total + exp.calculatedAmount, 0);
      monthlyData.push({
        month: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        expenses: monthTotal
      });
    }
    return {
      totalExpenses,
      totalIncomes,
      balance,
      categoryData,
      monthlyData
    };
  };
  const dashboardData = getDashboardData();
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };
  return (
    <div className={`min-h-screen d-flex flex-column ${darkMode ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      <style>
        {`
          .bg-header-green {
            background-color: #28a745 !important;
          }
          .bg-blue {
            background-color: #0b5ed7 !important;
          }
          .text-blue {
            color: #0b5ed7 !important;
          }
          .bg-dark-blue {
            background-color: #004085 !important;
          }
          .text-dark-blue {
            color: #004085 !important;
          }
          .bg-yellow {
            background-color: #ffc107 !important;
          }
          .text-yellow {
            color: #ffc107 !important;
          }
          .bg-success-light {
            background-color: #d4edda !important;
            border-color: #c3e6cb;
          }
          .bg-danger-light {
            background-color: #f8d7da !important;
            border-color: #f5c6cb;
          }
          .bg-warning-light {
            background-color: #fff3cd !important;
            border-color: #ffeaa7;
          }
          .bg-primary-light {
            background-color: #cce5ff !important;
            border-color: #b8daff;
          }
          .text-success-dark {
            color: #155724 !important;
          }
          .text-danger-dark {
            color: #721c24 !important;
          }
          .text-warning-dark {
            color: #856404 !important;
          }
          .text-primary-dark {
            color: #004085 !important;
          }
          .modern-table {
            border-collapse: separate;
            border-spacing: 0;
            width: 100%;
            font-size: 1rem;
          }
          .modern-table th, .modern-table td {
            padding: 8px 12px;
            border: 1px solid ${darkMode ? '#555' : '#dee2e6'};
            vertical-align: middle;
          }
          .modern-table th {
            font-weight: 600;
            font-size: 1.1rem;
            background-color: ${darkMode ? '#2c2c2c' : '#e9ecef'};
          }
          .modern-table tr:nth-child(even) {
            background-color: ${darkMode ? '#3a3a3a' : '#f5f5f5'};
          }
          .modern-table th:first-child, .modern-table td:first-child {
            border-top-left-radius: 8px;
            border-bottom-left-radius: 8px;
            width: 70%;
          }
          .modern-table th:last-child, .modern-table td:last-child {
            border-top-right-radius: 8px;
            border-bottom-right-radius: 8px;
            width: 30%;
          }
          .no-hover:hover {
            background-color: inherit !important;
            color: inherit !important;
            box-shadow: none !important;
          }
          .chart-container {
            min-height: 300px;
          }
          .card-header-action {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .dashboard-filters {
            background-color: ${darkMode ? '#3a3a3a' : '#f8f9fa'};
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
          }
          .filter-group {
            margin-bottom: 10px;
          }
          .filter-label {
            font-weight: 500;
            margin-bottom: 5px;
            color: ${darkMode ? '#e9ecef' : '#495057'};
          }
          .filter-button {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 5px 10px;
            border-radius: 5px;
            border: 1px solid ${darkMode ? '#495057' : '#ced4da'};
            background-color: ${darkMode ? '#2c2c2c' : '#fff'};
            color: ${darkMode ? '#e9ecef' : '#495057'};
            cursor: pointer;
            transition: all 0.2s;
          }
          .filter-button:hover {
            background-color: ${darkMode ? '#495057' : '#e9ecef'};
          }
          .profile-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: ${darkMode ? '#3a3a3a' : '#e9ecef'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: bold;
            color: ${darkMode ? '#e9ecef' : '#495057'};
            margin: 0 auto 1rem auto;
          }
          .notification-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 1rem;
            border-bottom: 1px solid ${darkMode ? '#495057' : '#dee2e6'};
          }
          .notification-item:last-child {
            border-bottom: none;
          }
          .logout-btn {
            background-color: #dc3545;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 5px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
            transition: background-color 0.2s;
          }
          .logout-btn:hover {
            background-color: #c82333;
          }
          .pie-chart-legend {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 15px;
            justify-content: center;
          }
          .legend-item {
            display: flex;
            align-items: center;
            font-size: 0.9rem;
          }
          .legend-color {
            width: 12px;
            height: 12px;
            margin-right: 6px;
            border-radius: 2px;
          }
          .line-chart {
            width: 100%;
            height: 250px;
            position: relative;
          }
          .line-chart-grid {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: linear-gradient(to right, transparent 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px);
            background-size: 50px 50px;
            z-index: 1;
          }
          .line-chart-line {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2;
          }
          .line-chart-path {
            fill: none;
            stroke: #dc3545;
            stroke-width: 3;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
          .line-chart-points {
            fill: #dc3545;
          }
          .line-chart-labels {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            display: flex;
            justify-content: space-between;
            padding: 10px 20px 0 20px;
            z-index: 3;
          }
          .chart-label {
            text-align: center;
            font-size: 0.8rem;
            color: ${darkMode ? '#e9ecef' : '#495057'};
          }
          .chart-value {
            font-weight: bold;
            margin-top: 2px;
          }
        `}
      </style>
      <header className="bg-header-green text-white px-3 py-2 shadow-sm">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <div className="bg-white p-2 rounded-circle me-2">
              <FaPiggyBank className="app-logo text-blue" />
            </div>
            <h1 className="h4 mb-0 fw-bold">MoneyTracker</h1>
          </div>
          <div className="d-flex align-items-center">
            <button 
              onClick={toggleDarkMode}
              className="btn btn-light me-2"
              title={darkMode ? "Passer en mode clair" : "Passer en mode sombre"}
            >
              <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
            </button>
            <button 
              onClick={() => setShowIncomeForm(true)}
              className="btn btn-light me-2"
            >
              <FontAwesomeIcon icon={faMoneyBillWave} className="me-1" />
              <span className="d-none d-md-inline">Nouveau Revenu</span>
            </button>
            <button 
              onClick={() => setShowForm(true)}
              className="btn btn-light"
            >
              <FontAwesomeIcon icon={faPlus} className="me-1" />
              <span className="d-none d-md-inline">Nouvelle Dépense</span>
            </button>
          </div>
        </div>
      </header>
      <div className="container-fluid flex-grow-1">
        <div className="row h-100">
          <aside className="col-md-3 col-lg-2 d-md-block bg-blue text-white p-3 sidebar">
            <div className="position-sticky pt-3">
              <h2 className="h6 text-white-50 mb-3">Navigation</h2>
              <ul className="nav nav-pills flex-column mb-auto">
                <li className="nav-item">
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`nav-link text-start w-100 d-flex align-items-center ${activeTab === 'dashboard' ? 'active bg-white text-blue' : 'text-white'} rounded mb-2`}
                  >
                    <FontAwesomeIcon icon={faChartPie} className="me-2" />
                    Tableau de Bord
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    onClick={() => setActiveTab('expenses')}
                    className={`nav-link text-start w-100 d-flex align-items-center ${activeTab === 'expenses' ? 'active bg-white text-blue' : 'text-white'} rounded mb-2`}
                  >
                    <FontAwesomeIcon icon={faChartPie} className="me-2" />
                    Gestion de Dépense
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    onClick={() => setActiveTab('incomes')}
                    className={`nav-link text-start w-100 d-flex align-items-center ${activeTab === 'incomes' ? 'active bg-white text-blue' : 'text-white'} rounded mb-2`}
                  >
                    <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                    Gestion de Revenus
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    onClick={() => setActiveTab('categories')}
                    className={`nav-link text-start w-100 d-flex align-items-center ${activeTab === 'categories' ? 'active bg-white text-blue' : 'text-white'} rounded mb-2`}
                  >
                    <FontAwesomeIcon icon={faTags} className="me-2" />
                    Gestion de Catégories
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    onClick={() => setActiveTab('sources')}
                    className={`nav-link text-start w-100 d-flex align-items-center ${activeTab === 'sources' ? 'active bg-white text-blue' : 'text-white'} rounded mb-2`}
                  >
                    <FontAwesomeIcon icon={faWallet} className="me-2" />
                    Gestion de Sources
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className={`nav-link text-start w-100 d-flex align-items-center ${activeTab === 'profile' ? 'active bg-white text-blue' : 'text-white'} rounded mb-2`}
                  >
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    Profil & Paramètres
                  </button>
                </li>
                <li className="nav-item">
                    <a href="/date" onClick={handleLogout} className="nav-link text-start w-100 d-flex align-items-center text-white rounded mb-2">
                        <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                        Déconnexion
                    </a>
                </li>
              </ul>
            </div>
          </aside>
          <main className="col-md-9 col-lg-10 px-md-4 py-4">
            {activeTab === 'dashboard' && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2 className="h4">Tableau de Bord & Résumé Mensuel</h2>
                  <div className="filter-button" onClick={() => setShowDashboardFilters(!showDashboardFilters)}>
                    <FontAwesomeIcon icon={faFilter} />
                    <span>Filtres</span>
                  </div>
                </div>
                {showDashboardFilters && (
                  <div className="dashboard-filters">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="filter-group">
                          <label className="filter-label">Période personnalisée</label>
                          <div className="d-flex gap-2">
                            <input
                              type="date"
                              className={`form-control ${darkMode ? 'bg-dark text-light' : ''}`}
                              value={dashboardFilters.startDate}
                              onChange={(e) => setDashboardFilters({...dashboardFilters, startDate: e.target.value})}
                            />
                            <span className="align-self-center">à</span>
                            <input
                              type="date"
                              className={`form-control ${darkMode ? 'bg-dark text-light' : ''}`}
                              value={dashboardFilters.endDate}
                              onChange={(e) => setDashboardFilters({...dashboardFilters, endDate: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="filter-group">
                          <label className="filter-label">Catégorie</label>
                          <select
                            className={`form-select ${darkMode ? 'bg-dark text-light' : ''}`}
                            value={dashboardFilters.category}
                            onChange={(e) => setDashboardFilters({...dashboardFilters, category: e.target.value})}
                          >
                            <option value="">Toutes les catégories</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="row mt-3">
                      <div className="col-md-6">
                        <div className="filter-group">
                          <label className="filter-label">Type de dépense</label>
                          <select
                            className={`form-select ${darkMode ? 'bg-dark text-light' : ''}`}
                            value={dashboardFilters.type}
                            onChange={(e) => setDashboardFilters({...dashboardFilters, type: e.target.value})}
                          >
                            <option value="">Tous les types</option>
                            <option value="Ponctuelle">Ponctuelle</option>
                            <option value="Recurrente">Récurrente</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6 d-flex align-items-end">
                        <button
                          className="btn btn-secondary"
                          onClick={() => setDashboardFilters({
                            category: '',
                            type: '',
                            startDate: '',
                            endDate: ''
                          })}
                        >
                          Réinitialiser
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="row mb-4">
                  <div className="col-md-3 mb-3">
                    <div className={`card bg-success-light shadow-sm border-success`}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="card-title text-success-dark">Revenus</h5>
                          <FontAwesomeIcon icon={faMoneyBillWave} className="text-success fs-4" />
                        </div>
                        <p className="card-text display-6 fw-bold text-success">{formatCurrency(dashboardData.totalIncomes)}</p>
                        <p className="card-text small text-success-dark">Total des revenus</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className={`card bg-warning-light shadow-sm border-warning`}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="card-title text-warning-dark">Dépenses</h5>
                          <FontAwesomeIcon icon={faReceipt} className="text-warning fs-4" />
                        </div>
                        <p className="card-text display-6 fw-bold text-warning">{formatCurrency(dashboardData.totalExpenses)}</p>
                        <p className="card-text small text-warning-dark">Total des dépenses</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className={`card ${dashboardData.balance >= 0 ? 'bg-success-light border-success' : 'bg-danger-light border-danger'} shadow-sm`}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="card-title ${dashboardData.balance >= 0 ? 'text-success-dark' : 'text-danger-dark'}">Solde</h5>
                          <FontAwesomeIcon icon={faWallet} className={`${dashboardData.balance >= 0 ? 'text-success' : 'text-danger'} fs-4`} />
                        </div>
                        <p className={`card-text display-6 fw-bold ${dashboardData.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatCurrency(dashboardData.balance)}
                        </p>
                        <p className={`card-text small ${dashboardData.balance >= 0 ? 'text-success-dark' : 'text-danger-dark'}`}>
                          {dashboardData.balance >= 0 ? 'Excédent' : 'Déficit'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className={`card bg-primary-light shadow-sm border-primary`}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="card-title text-primary-dark">Taux d'épargne</h5>
                          <FontAwesomeIcon icon={faChartBar} className="text-primary fs-4" />
                        </div>
                        <p className="card-text display-6 fw-bold text-primary">
                          {dashboardData.totalIncomes > 0 ? 
                            `${Math.round((dashboardData.balance / dashboardData.totalIncomes) * 100)}%` : '0%'}
                        </p>
                        <p className="card-text small text-primary-dark">
                          {dashboardData.balance >= 0 ? 'Épargné' : 'Dépensé'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-lg-6 mb-4">
                    <div className={`card ${darkMode ? 'bg-secondary text-light' : 'bg-white text-dark'} shadow-sm chart-container`}>
                      <div className="card-header">
                        <h5 className="mb-0">Répartition par catégories</h5>
                      </div>
                      <div className="card-body">
                        {Object.keys(dashboardData.categoryData).length > 0 ? (
                          <div className="d-flex flex-column align-items-center">
                            <div style={{ width: '250px', height: '250px', position: 'relative' }}>
                              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                                {(() => {
                                  let cumulativePercentage = 0;
                                  const total = Object.values(dashboardData.categoryData).reduce((a, b) => a + b, 0);
                                  const colors = ['#28a745', '#007bff', '#ffc107', '#17a2b8', '#6f42c1', '#fd7e14'];
                                  return Object.entries(dashboardData.categoryData).map(([category, amount], index) => {
                                    const percentage = (amount / total) * 100;
                                    const sweepFlag = percentage > 50 ? 1 : 0;
                                    const x1 = 50 + 45 * Math.cos(2 * Math.PI * cumulativePercentage / 100);
                                    const y1 = 50 + 45 * Math.sin(2 * Math.PI * cumulativePercentage / 100);
                                    const x2 = 50 + 45 * Math.cos(2 * Math.PI * (cumulativePercentage + percentage) / 100);
                                    const y2 = 50 + 45 * Math.sin(2 * Math.PI * (cumulativePercentage + percentage) / 100);
                                    const pathData = `
                                      M 50 50
                                      L ${x1} ${y1}
                                      A 45 45 0 ${sweepFlag} 1 ${x2} ${y2}
                                      Z
                                    `;
                                    const color = colors[index % colors.length];
                                    cumulativePercentage += percentage;
                                    return (
                                      <path
                                        key={category}
                                        d={pathData}
                                        fill={color}
                                        stroke={darkMode ? '#3a3a3a' : '#fff'}
                                        strokeWidth="2"
                                        style={{ transition: 'all 0.3s ease' }}
                                      />
                                    );
                                  });
                                })()}
                              </svg>
                            </div>
                            <div className="pie-chart-legend">
                              {Object.entries(dashboardData.categoryData).map(([category, amount], index) => {
                                const total = Object.values(dashboardData.categoryData).reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;
                                const colors = ['#28a745', '#007bff', '#ffc107', '#17a2b8', '#6f42c1', '#fd7e14'];
                                const color = colors[index % colors.length];
                                return (
                                  <div key={category} className="legend-item">
                                    <div className="legend-color" style={{ backgroundColor: color }}></div>
                                    <div>
                                      <strong>{category}</strong>: {formatCurrency(amount)} ({percentage}%)
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-5">
                            <FontAwesomeIcon icon={faChartPie} className="text-muted fs-1 mb-3" />
                            <p className="text-muted">Aucune donnée de dépense disponible</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6 mb-4">
                    <div className={`card ${darkMode ? 'bg-secondary text-light' : 'bg-white text-dark'} shadow-sm chart-container`}>
                      <div className="card-header">
                        <h5 className="mb-0">Évolution mensuelle</h5>
                      </div>
                      <div className="card-body">
                        {dashboardData.monthlyData.length > 0 ? (
                          <div className="d-flex flex-column align-items-center">
                            <div className="line-chart">
                              <div className="line-chart-grid"></div>
                              <svg className="line-chart-line">
                                <defs>
                                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#dc3545" stopOpacity="0.3"/>
                                    <stop offset="100%" stopColor="#dc3545" stopOpacity="0"/>
                                  </linearGradient>
                                </defs>
                                <path 
                                  className="line-chart-path" 
                                  d={(() => {
                                    const max = Math.max(...dashboardData.monthlyData.map(d => d.expenses));
                                    const points = dashboardData.monthlyData.map((data, index) => {
                                      const x = (index / (dashboardData.monthlyData.length - 1)) * 100;
                                      const y = 100 - (data.expenses / max) * 80;
                                      return `${x},${y}`;
                                    }).join(' L ');
                                    return `M ${points} L 100,100 L 0,100 Z`;
                                  })()}
                                  fill="url(#gradient)"
                                />
                                <path 
                                  className="line-chart-path" 
                                  d={(() => {
                                    const max = Math.max(...dashboardData.monthlyData.map(d => d.expenses));
                                    return dashboardData.monthlyData.map((data, index) => {
                                      const x = (index / (dashboardData.monthlyData.length - 1)) * 100;
                                      const y = 100 - (data.expenses / max) * 80;
                                      return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
                                    }).join(' ');
                                  })()}
                                />
                                {dashboardData.monthlyData.map((data, index) => {
                                  const max = Math.max(...dashboardData.monthlyData.map(d => d.expenses));
                                  const x = (index / (dashboardData.monthlyData.length - 1)) * 100;
                                  const y = 100 - (data.expenses / max) * 80;
                                  return (
                                    <circle 
                                      key={index}
                                      className="line-chart-points"
                                      cx={`${x}%`}
                                      cy={`${y}%`}
                                      r="4"
                                      style={{ transition: 'all 0.3s ease' }}
                                    />
                                  );
                                })}
                              </svg>
                              <div className="line-chart-labels">
                                {dashboardData.monthlyData.map((data, index) => (
                                  <div key={index} className="chart-label">
                                    <div>{data.month}</div>
                                    <div className="chart-value">{formatCurrency(data.expenses)}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-5">
                            <FontAwesomeIcon icon={faChartBar} className="text-muted fs-1 mb-3" />
                            <p className="text-muted">Aucune donnée historique disponible</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {activeTab === 'expenses' && (
              <>
                <div className={`card ${darkMode ? 'bg-secondary text-light' : 'bg-white text-dark'} shadow-sm mb-4`}>
                  <div className="card-body">
                    <h5 className="card-title mb-3">Filtres</h5>
                    <div className="d-flex flex-wrap gap-3">
                      <select 
                        className={`form-select ${darkMode ? 'bg-dark text-light border-secondary' : 'border-secondary'}`}
                        value={filter.category}
                        onChange={(e) => setFilter({...filter, category: e.target.value})}
                        style={{width: 'auto'}}
                      >
                        <option value="">Toutes les catégories</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <select 
                        className={`form-select ${darkMode ? 'bg-dark text-light border-secondary' : 'border-secondary'}`}
                        value={filter.type}
                        onChange={(e) => setFilter({...filter, type: e.target.value})}
                        style={{width: 'auto'}}
                      >
                        <option value="">Tous les types</option>
                        <option value="Ponctuelle">Ponctuelle</option>
                        <option value="Recurrente">Récurrente</option>
                      </select>
                    </div>
                  </div>
                </div>
                {showForm && (
                  <ExpenseForm 
                    expense={editingExpense}
                    categories={categories}
                    onSave={handleSaveExpense}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingExpense(null);
                    }}
                    darkMode={darkMode}
                  />
                )}
                <ExpenseList 
                  expenses={filteredExpenses}
                  onEdit={handleEditExpense}
                  onDelete={handleDeleteExpense}
                  onDownloadReceipt={handleDownloadReceipt}
                  onViewReceipt={handleViewReceipt}
                  onConvertExpense={handleConvertExpense}
                  darkMode={darkMode}
                />
              </>
            )}
            {activeTab === 'incomes' && (
              <>
                <div className={`card ${darkMode ? 'bg-secondary text-light' : 'bg-white text-dark'} shadow-sm mb-4`}>
                  <div className="card-body">
                    <h5 className="card-title mb-3">Filtres</h5>
                    <div className="d-flex flex-wrap gap-3">
                      <select 
                        className={`form-select ${darkMode ? 'bg-dark text-light border-secondary' : 'border-secondary'}`}
                        value={incomeFilter.source}
                        onChange={(e) => setIncomeFilter({...incomeFilter, source: e.target.value})}
                        style={{width: 'auto'}}
                      >
                        <option value="">Toutes les sources</option>
                        {sources.map(src => (
                          <option key={src} value={src}>{src}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                {showIncomeForm && (
                  <IncomeForm 
                    income={editingIncome}
                    sources={sources}
                    onSave={handleSaveIncome}
                    onCancel={() => {
                      setShowIncomeForm(false);
                      setEditingIncome(null);
                    }}
                    darkMode={darkMode}
                  />
                )}
                <IncomeList 
                  incomes={filteredIncomes}
                  onEdit={handleEditIncome}
                  onDelete={handleDeleteIncome}
                  darkMode={darkMode}
                />
              </>
            )}
            {activeTab === 'categories' && (
              <CategoriesManager 
                categories={categories}
                onAddCategory={handleAddCategory}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
                darkMode={darkMode}
              />
            )}
            {activeTab === 'sources' && (
              <SourcesManager 
                sources={sources}
                onAddSource={handleAddSource}
                onEditSource={handleEditSource}
                onDeleteSource={handleDeleteSource}
                darkMode={darkMode}
              />
            )}
            {activeTab === 'profile' && (
              <div className="row">
                <div className="col-lg-8">
                  <div className={`card ${darkMode ? 'bg-secondary text-light' : 'bg-white text-dark'} shadow-sm mb-4`}>
                    <div className="card-header">
                      <h5 className="mb-0">Informations du Profil</h5>
                    </div>
                    <div className="card-body">
                      <div className="text-center mb-4">
                        <div className="profile-avatar">
                          {userProfile.firstName.charAt(0).toUpperCase()}{userProfile.lastName.charAt(0).toUpperCase()}
                        </div>
                        <h5>{userProfile.firstName} {userProfile.lastName}</h5>
                        <p className="text-muted">{userProfile.email}</p>
                      </div>
                      <form onSubmit={handleProfileSubmit}>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Prénom *</label>
                            <input
                              type="text"
                              className={`form-control ${profileErrors.firstName ? 'is-invalid' : ''} ${darkMode ? 'bg-dark text-light' : ''}`}
                              value={profileForm.firstName}
                              onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                            />
                            {profileErrors.firstName && <div className="invalid-feedback">{profileErrors.firstName}</div>}
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Nom *</label>
                            <input
                              type="text"
                              className={`form-control ${profileErrors.lastName ? 'is-invalid' : ''} ${darkMode ? 'bg-dark text-light' : ''}`}
                              value={profileForm.lastName}
                              onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                            />
                            {profileErrors.lastName && <div className="invalid-feedback">{profileErrors.lastName}</div>}
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Email *</label>
                          <input
                            type="email"
                            className={`form-control ${profileErrors.email ? 'is-invalid' : ''} ${darkMode ? 'bg-dark text-light' : ''}`}
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                          />
                          {profileErrors.email && <div className="invalid-feedback">{profileErrors.email}</div>}
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Téléphone</label>
                          <input
                            type="tel"
                            className={`form-control ${darkMode ? 'bg-dark text-light' : ''}`}
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                            placeholder="06 12 34 56 78"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Date de création du compte</label>
                          <input
                            type="text"
                            className={`form-control ${darkMode ? 'bg-dark text-light' : ''}`}
                            value={new Date(userProfile.createdAt).toLocaleDateString('fr-FR')}
                            disabled
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Dernière modification du mot de passe</label>
                          <input
                            type="text"
                            className={`form-control ${darkMode ? 'bg-dark text-light' : ''}`}
                            value={userProfile.passwordChanged 
                              ? new Date(userProfile.passwordChanged).toLocaleDateString('fr-FR')
                              : 'Jamais'
                            }
                            disabled
                          />
                        </div>
                        <div className="d-flex justify-content-end">
                          <button type="submit" className="btn btn-blue">
                            Mettre à jour le profil
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className={`card ${darkMode ? 'bg-secondary text-light' : 'bg-white text-dark'} shadow-sm mb-4`}>
                    <div className="card-header">
                      <h5 className="mb-0">Sécurité</h5>
                    </div>
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-4">
                        <div className="me-3 p-2 bg-blue text-white rounded">
                          <FontAwesomeIcon icon={faKey} />
                        </div>
                        <div>
                          <h6 className="mb-0">Mot de passe</h6>
                          <small className="text-muted">Modifiez votre mot de passe</small>
                        </div>
                      </div>
                      {showPasswordForm ? (
                        <form onSubmit={handlePasswordSubmit}>
                          <div className="mb-3">
                            <label className="form-label">Mot de passe actuel</label>
                            <input
                              type="password"
                              className={`form-control ${passwordErrors.currentPassword ? 'is-invalid' : ''} ${darkMode ? 'bg-dark text-light' : ''}`}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            />
                            {passwordErrors.currentPassword && (
                              <div className="invalid-feedback">{passwordErrors.currentPassword}</div>
                            )}
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Nouveau mot de passe</label>
                            <input
                              type="password"
                              className={`form-control ${passwordErrors.newPassword ? 'is-invalid' : ''} ${darkMode ? 'bg-dark text-light' : ''}`}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            />
                            {passwordErrors.newPassword && (
                              <div className="invalid-feedback">{passwordErrors.newPassword}</div>
                            )}
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Confirmer le nouveau mot de passe</label>
                            <input
                              type="password"
                              className={`form-control ${passwordErrors.confirmPassword ? 'is-invalid' : ''} ${darkMode ? 'bg-dark text-light' : ''}`}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            />
                            {passwordErrors.confirmPassword && (
                              <div className="invalid-feedback">{passwordErrors.confirmPassword}</div>
                            )}
                          </div>
                          <div className="d-flex gap-2">
                            <button type="submit" className="btn btn-success">
                              Mettre à jour
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-secondary"
                              onClick={() => {
                                setShowPasswordForm(false);
                                setPasswordData({
                                  currentPassword: '',
                                  newPassword: '',
                                  confirmPassword: ''
                                });
                                setPasswordErrors({});
                              }}
                            >
                              Annuler
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button 
                          className="btn btn-outline-primary w-100"
                          onClick={() => setShowPasswordForm(true)}
                        >
                          <FontAwesomeIcon icon={faKey} className="me-2" />
                          Changer le mot de passe
                        </button>
                      )}
                    </div>
                  </div>
                  <div className={`card ${darkMode ? 'bg-secondary text-light' : 'bg-white text-dark'} shadow-sm mb-4`}>
                    <div className="card-header">
                      <h5 className="mb-0">Notifications</h5>
                    </div>
                    <div className="card-body">
                      <div className="notification-item">
                        <div>
                          <h6 className="mb-1">Notifications par email</h6>
                          <small className="text-muted">Recevoir des alertes par email</small>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="emailNotifications"
                            name="email"
                            checked={userProfile.notificationPreferences.email}
                            onChange={handleNotificationChange}
                          />
                        </div>
                      </div>
                      <div className="notification-item">
                        <div>
                          <h6 className="mb-1">Notifications push</h6>
                          <small className="text-muted">Recevoir des notifications sur votre appareil</small>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="pushNotifications"
                            name="push"
                            checked={userProfile.notificationPreferences.push}
                            onChange={handleNotificationChange}
                          />
                        </div>
                      </div>
                      <div className="notification-item">
                        <div>
                          <h6 className="mb-1">Résumé mensuel</h6>
                          <small className="text-muted">Recevoir un résumé de vos finances chaque mois</small>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="summaryNotifications"
                            name="summary"
                            checked={userProfile.notificationPreferences.summary}
                            onChange={handleNotificationChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
      <footer className="bg-dark-blue text-white py-4 mt-auto">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h5 className="text-white">MoneyTracker</h5>
              <p className="text-white">Application de suivi de finances personnelles</p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="mb-0 text-white">&copy; 2023 MoneyTracker. Tous droits réservés.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
const ExpenseForm = ({ expense, categories, onSave, onCancel, darkMode }) => {
  const [formData, setFormData] = useState({
    amount: '',
    date: '',
    category: '',
    description: '',
    type: 'Ponctuelle',
    receipt: null,
    startDate: '',
    endDate: ''
  });
  const [errors, setErrors] = useState({});
  const [selectedFileName, setSelectedFileName] = useState('');
  useEffect(() => {
    if (expense) {
      setFormData({
        amount: expense.amount || '',
        date: expense.date || '',
        category: expense.category || '',
        description: expense.description || '',
        type: expense.type || 'Ponctuelle',
        receipt: expense.receipt || null,
        startDate: expense.startDate || '',
        endDate: expense.endDate || ''
      });
      setSelectedFileName(expense.receiptName || '');
    }
  }, [expense]);
  const validateForm = () => {
    const newErrors = {};
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Le montant est obligatoire et doit être positif';
    }
    if (!formData.category) {
      newErrors.category = 'La catégorie est obligatoire';
    }
    if (formData.type === 'Ponctuelle' && !formData.date) {
      newErrors.date = 'La date est obligatoire pour une dépense ponctuelle';
    }
    if (formData.type === 'Recurrente') {
      if (!formData.startDate) {
        newErrors.startDate = 'La date de début est obligatoire pour une dépense récurrente';
      }
      if (formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
        newErrors.endDate = 'La date de fin ne peut pas être avant la date de début';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData({...formData, [name]: files[0]});
      setSelectedFileName(files[0]?.name || '');
    } else {
      setFormData({...formData, [name]: value});
    }
    if (errors[name]) {
      setErrors({...errors, [name]: ''});
    }
  };
  return (
    <div className={`card ${darkMode ? 'bg-secondary text-light' : 'bg-white text-dark'} shadow-sm mb-4`}>
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{expense ? 'Modifier la dépense' : 'Nouvelle dépense'}</h5>
        <button onClick={onCancel} className="btn-close" aria-label="Close"></button>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Montant *</label>
              <input
                type="number"
                step="0.01"
                className={`form-control ${errors.amount ? 'is-invalid' : ''} ${darkMode ? 'bg-dark text-light' : ''}`}
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
              />
              {errors.amount && <div className="invalid-feedback">{errors.amount}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">Catégorie *</label>
              <select
                className={`form-select ${errors.category ? 'is-invalid' : ''} ${darkMode ? 'bg-dark text-light' : ''}`}
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Sélectionnez une catégorie</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <div className="invalid-feedback">{errors.category}</div>}
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className={`form-control ${darkMode ? 'bg-dark text-light' : ''}`}
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              placeholder="Description de la dépense..."
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Type</label>
            <div className="d-flex gap-4">
              <div className="form-check">
                <input
                  type="radio"
                  name="type"
                  value="Ponctuelle"
                  checked={formData.type === 'Ponctuelle'}
                  onChange={handleChange}
                  className="form-check-input"
                  id="typePonctuelle"
                />
                <label className="form-check-label" htmlFor="typePonctuelle">
                  Ponctuelle
                </label>
              </div>
              <div className="form-check">
                <input
                  type="radio"
                  name="type"
                  value="Recurrente"
                  checked={formData.type === 'Recurrente'}
                  onChange={handleChange}
                  className="form-check-input"
                  id="typeRecurrente"
                />
                <label className="form-check-label" htmlFor="typeRecurrente">
                  Récurrente
                </label>
              </div>
            </div>
          </div>
          {formData.type === 'Ponctuelle' ? (
            <div className="mb-3">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className={`form-control ${errors.date ? 'is-invalid' : ''} ${darkMode ? 'bg-dark text-light' : ''}`}
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
              {errors.date && <div className="invalid-feedback">{errors.date}</div>}
            </div>
          ) : (
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Date de début *</label>
                <input
                  type="date"
                  className={`form-control ${errors.startDate ? 'is-invalid' : ''} ${darkMode ? 'bg-dark text-light' : ''}`}
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                />
                {errors.startDate && <div className="invalid-feedback">{errors.startDate}</div>}
                <div className="form-text">Définit quand la dépense doit commencer à apparaître</div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Date de fin (optionnelle)</label>
                <input
                  type="date"
                  className={`form-control ${errors.endDate ? 'is-invalid' : ''} ${darkMode ? 'bg-dark text-light' : ''}`}
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                />
                {errors.endDate && <div className="invalid-feedback">{errors.endDate}</div>}
                <div className="form-text">Si non spécifiée, la dépense est considérée comme en cours</div>
              </div>
            </div>
          )}
          <div className="mb-4">
            <label className="form-label">Reçu (optionnel)</label>
            <div className="input-group">
              <input
                type="file"
                className={`form-control ${darkMode ? 'bg-dark text-light' : ''}`}
                name="receipt"
                onChange={handleChange}
                accept="image/*,.pdf"
                id="receiptFile"
              />
              <label className={`input-group-text ${darkMode ? 'bg-secondary text-light' : ''}`} htmlFor="receiptFile">
                <FontAwesomeIcon icon={faPaperclip} />
              </label>
            </div>
            {selectedFileName && (
              <div className="form-text">
                Fichier sélectionné: {selectedFileName}
              </div>
            )}
            <div className="form-text">
              Formats acceptés: images (JPG, PNG, 5MO) et PDF
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button 
              type="button" 
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className="btn btn-blue"
            >
              {expense ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
const IncomeForm = ({ income, sources, onSave, onCancel, darkMode }) => {
  const [formData, setFormData] = useState({
    amount: '',
    date: '',
    source: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (income) {
      setFormData({
        amount: income.amount || '',
        date: income.date || '',
        source: income.source || '',
        description: income.description || ''
      });
    }
  }, [income]);
  const validateForm = () => {
    const newErrors = {};
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Le montant est obligatoire et doit être positif';
    }
    if (!formData.source) {
      newErrors.source = 'La source est obligatoire';
    }
    if (!formData.date) {
      newErrors.date = 'La date est obligatoire';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({...formData, [name]: value});
    if (errors[name]) {
      setErrors({...errors, [name]: ''});
    }
  };
  return (
    <div className={`card ${darkMode ? 'bg-secondary text-light' : 'bg-white text-dark'} shadow-sm mb-4`}>
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{income ? 'Modifier le revenu' : 'Nouveau revenu'}</h5>
        <button onClick={onCancel} className="btn-close" aria-label="Close"></button>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Montant *</label>
              <input
                type="number"
                step="0.01"
                className={`form-control ${errors.amount ? 'is-invalid' : ''} ${darkMode ? 'bg-dark text-light' : ''}`}
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
              />
              {errors.amount && <div className="invalid-feedback">{errors.amount}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">Source *</label>
              <select
                className={`form-select ${errors.source ? 'is-invalid' : ''} ${darkMode ? 'bg-dark text-light' : ''}`}
                name="source"
                value={formData.source}
                onChange={handleChange}
              >
                <option value="">Sélectionnez une source</option>
                {sources.map(src => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
              {errors.source && <div className="invalid-feedback">{errors.source}</div>}
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Date *</label>
            <input
              type="date"
              className={`form-control ${errors.date ? 'is-invalid' : ''} ${darkMode ? 'bg-dark text-light' : ''}`}
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
            {errors.date && <div className="invalid-feedback">{errors.date}</div>}
          </div>
          <div className="mb-4">
            <label className="form-label">Description (optionnelle)</label>
            <textarea
              className={`form-control ${darkMode ? 'bg-dark text-light' : ''}`}
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              placeholder="Description du revenu..."
            />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button 
              type="button" 
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className="btn btn-blue"
            >
              {income ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
const ExpenseList = ({ expenses, onEdit, onDelete, onDownloadReceipt, onViewReceipt, onConvertExpense, darkMode }) => {
  if (expenses.length === 0) {
    return (
      <div className={`card ${darkMode ? 'bg-secondary text-light' : 'bg-white text-dark'} text-center shadow-sm`}>
        <div className="card-body">
          <FontAwesomeIcon icon={faReceipt} className="text-muted fs-1 mb-3" />
          <h5 className="card-title">Aucune dépense</h5>
          <p className={`card-text ${darkMode ? 'text-light' : 'text-muted'}`}>Cliquez sur "Nouvelle Dépense" pour commencer</p>
        </div>
      </div>
    );
  }
  return (
    <div className={`card ${darkMode ? 'bg-secondary text-light' : 'bg-white text-dark'} shadow-sm`}>
      <div className="card-header">
        <h5 className="mb-0">Liste des Dépenses</h5>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className={`table ${darkMode ? 'table-dark' : 'table-hover'} mb-0`}>
            <thead>
              <tr>
                <th>Montant</th>
                <th>Catégorie</th>
                <th>Description</th>
                <th>Type</th>
                <th>Date/Période</th>
                <th>Reçu</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => {
                const isActiveRecurring = expense.type === 'Recurrente' && 
                  (!expense.endDate || new Date(expense.endDate) >= new Date()) &&
                  new Date(expense.startDate) <= new Date();
                return (
                  <tr key={expense.id}>
                    <td className="fw-bold">{parseFloat(expense.amount).toFixed(2)} €</td>
                    <td>
                      <span className="badge bg-blue">
                        {expense.category}
                      </span>
                    </td>
                    <td>{expense.description || '-'}</td>
                    <td>
                      <span className={`badge ${expense.type === 'Ponctuelle' ? 'bg-info' : 'bg-purple'}`}>
                        {expense.type}
                        {expense.type === 'Recurrente' && isActiveRecurring && (
                          <FontAwesomeIcon icon={faBell} className="ms-1" title="Dépense active" />
                        )}
                      </span>
                    </td>
                    <td>
                      {expense.type === 'Ponctuelle' 
                        ? new Date(expense.date).toLocaleDateString() 
                        : `Début: ${new Date(expense.startDate).toLocaleDateString()}${expense.endDate ? `, Fin: ${new Date(expense.endDate).toLocaleDateString()}` : ''}`
                      }
                    </td>
                    <td>
                      {expense.receipt ? (
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-outline-blue"
                            onClick={() => onViewReceipt(expense)}
                            title="Voir le reçu"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => onDownloadReceipt(expense)}
                            title="Télécharger le reçu"
                          >
                            <FontAwesomeIcon icon={faDownload} />
                          </button>
                        </div>
                      ) : (
                        <span className={darkMode ? 'text-light' : 'text-muted'}>Aucun</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button 
                          onClick={() => onEdit(expense)}
                          className="btn btn-sm btn-info"
                          title="Modifier"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button 
                          onClick={() => onConvertExpense(expense)}
                          className="btn btn-sm btn-warning"
                          title={`Convertir en ${expense.type === 'Ponctuelle' ? 'récurrente' : 'ponctuelle'}`}
                        >
                          <FontAwesomeIcon icon={faExchangeAlt} />
                        </button>
                        <button 
                          onClick={() => onDelete(expense.id)}
                          className="btn btn-sm btn-danger"
                          title="Supprimer"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
const IncomeList = ({ incomes, onEdit, onDelete, darkMode }) => {
  if (incomes.length === 0) {
    return (
      <div className={`card ${darkMode ? 'bg-secondary text-light' : 'bg-white text-dark'} text-center shadow-sm`}>
        <div className="card-body">
          <FontAwesomeIcon icon={faMoneyBillWave} className="text-muted fs-1 mb-3" />
          <h5 className="card-title">Aucun revenu</h5>
          <p className={`card-text ${darkMode ? 'text-light' : 'text-muted'}`}>Cliquez sur "Nouveau Revenu" pour commencer</p>
        </div>
      </div>
    );
  }
  return (
    <div className={`card ${darkMode ? 'bg-secondary text-light' : 'bg-white text-dark'} shadow-sm`}>
      <div className="card-header">
        <h5 className="mb-0">Liste des Revenus</h5>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className={`table ${darkMode ? 'table-dark' : 'table-hover'} mb-0`}>
            <thead>
              <tr>
                <th>Montant</th>
                <th>Source</th>
                <th>Description</th>
                <th>Date</th>
                <th>Date de création</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map(income => (
                <tr key={income.id}>
                  <td className="fw-bold text-success">{parseFloat(income.amount).toFixed(2)} €</td>
                  <td>
                    <span className="badge bg-success">
                      {income.source}
                    </span>
                  </td>
                  <td>{income.description || '-'}</td>
                  <td>{new Date(income.date).toLocaleDateString()}</td>
                  <td>{new Date(income.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button 
                        onClick={() => onEdit(income)}
                        className="btn btn-sm btn-info"
                        title="Modifier"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button 
                        onClick={() => onDelete(income.id)}
                        className="btn btn-sm btn-danger"
                        title="Supprimer"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
const CategoriesManager = ({ categories, onAddCategory, onEditCategory, onDeleteCategory, darkMode }) => {
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const handleAddCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setNewCategory('');
    }
  };
  const startEditCategory = (category) => {
    setEditingCategory(category);
    setEditName(category);
  };
  const handleEditCategory = () => {
    if (editName.trim() && editName.trim() !== editingCategory) {
      onEditCategory(editingCategory, editName.trim());
      setEditingCategory(null);
      setEditName('');
    }
  };
  const cancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
  };
  const filteredCategories = categories.filter(category =>
    category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className={`card ${darkMode ? 'bg-secondary text-light' : 'bg-white text-dark'} shadow-sm`}>
      <div className="card-body">
        <h5 className="card-title">Gestion des Catégories</h5>
        <div className="mb-4">
          <h6 className="mb-3">Ajouter une nouvelle catégorie</h6>
          <div className="d-flex gap-2">
            <input
              type="text"
              className={`form-control ${darkMode ? 'bg-dark text-light' : ''}`}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nom de la nouvelle catégorie"
            />
            <button className="btn btn-blue" onClick={handleAddCategory}>
              Ajouter
            </button>
          </div>
        </div>
        <div className="mb-4">
          <h6 className="mb-3">Rechercher une catégorie</h6>
          <div className="input-group">
            <input
              type="text"
              className={`form-control ${darkMode ? 'bg-dark text-light' : ''}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une catégorie..."
            />
            <span className={`input-group-text ${darkMode ? 'bg-secondary text-light' : ''}`}>
              <FontAwesomeIcon icon={faSearch} />
            </span>
          </div>
        </div>
        <div>
          <h6 className="mb-3">Catégories existantes</h6>
          <div className="table-responsive">
            <table className={`modern-table ${darkMode ? 'table-dark' : ''}`}>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map(category => (
                    <tr key={category}>
                      <td>
                        {editingCategory === category ? (
                          <input
                            type="text"
                            className={`form-control form-control-sm ${darkMode ? 'bg-dark text-light' : ''}`}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        ) : (
                          <span className="badge bg-blue p-2">{category}</span>
                        )}
                      </td>
                      <td>
                        {editingCategory === category ? (
                          <div className="d-flex gap-1">
                            <button 
                              className="btn btn-success btn-sm"
                              onClick={handleEditCategory}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={cancelEdit}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex gap-1">
                            <button 
                              className="btn btn-info btn-sm"
                              onClick={() => startEditCategory(category)}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => onDeleteCategory(category)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="text-center">
                      Aucune catégorie trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
const SourcesManager = ({ sources, onAddSource, onEditSource, onDeleteSource, darkMode }) => {
  const [newSource, setNewSource] = useState('');
  const [editingSource, setEditingSource] = useState(null);
  const [editName, setEditName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const handleAddSource = () => {
    if (newSource.trim()) {
      onAddSource(newSource.trim());
      setNewSource('');
    }
  };
  const startEditSource = (source) => {
    setEditingSource(source);
    setEditName(source);
  };
  const handleEditSource = () => {
    if (editName.trim() && editName.trim() !== editingSource) {
      onEditSource(editingSource, editName.trim());
      setEditingSource(null);
      setEditName('');
    }
  };
  const cancelEdit = () => {
    setEditingSource(null);
    setEditName('');
  };
  const filteredSources = sources.filter(source =>
    source.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className={`card ${darkMode ? 'bg-secondary text-light' : 'bg-white text-dark'} shadow-sm`}>
      <div className="card-body">
        <h5 className="card-title">Gestion des Sources de Revenus</h5>
        <div className="mb-4">
          <h6 className="mb-3">Ajouter une nouvelle source</h6>
          <div className="d-flex gap-2">
            <input
              type="text"
              className={`form-control ${darkMode ? 'bg-dark text-light' : ''}`}
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder="Nom de la nouvelle source"
            />
            <button className="btn btn-blue" onClick={handleAddSource}>
              Ajouter
            </button>
          </div>
        </div>
        <div className="mb-4">
          <h6 className="mb-3">Rechercher une source</h6>
          <div className="input-group">
            <input
              type="text"
              className={`form-control ${darkMode ? 'bg-dark text-light' : ''}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une source..."
            />
            <span className={`input-group-text ${darkMode ? 'bg-secondary text-light' : ''}`}>
              <FontAwesomeIcon icon={faSearch} />
            </span>
          </div>
        </div>
        <div>
          <h6 className="mb-3">Sources existantes</h6>
          <div className="table-responsive">
            <table className={`modern-table ${darkMode ? 'table-dark' : ''}`}>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSources.length > 0 ? (
                  filteredSources.map(source => (
                    <tr key={source}>
                      <td>
                        {editingSource === source ? (
                          <input
                            type="text"
                            className={`form-control form-control-sm ${darkMode ? 'bg-dark text-light' : ''}`}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        ) : (
                          <span className="badge bg-success p-2">{source}</span>
                        )}
                      </td>
                      <td>
                        {editingSource === source ? (
                          <div className="d-flex gap-1">
                            <button 
                              className="btn btn-success btn-sm"
                              onClick={handleEditSource}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={cancelEdit}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex gap-1">
                            <button 
                              className="btn btn-info btn-sm"
                              onClick={() => startEditSource(source)}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => onDeleteSource(source)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="text-center">
                      Aucune source trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>''
      </div>
    </div>
  );
};
export default Dashboard;