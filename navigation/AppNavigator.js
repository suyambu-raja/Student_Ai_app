import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TextInput, TouchableOpacity, Text, Keyboard, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar, MessageSquare, FileText, User as UserIcon, Users, BookOpen } from 'lucide-react-native';
import { COLORS, STAFF_THEME } from '../utils/theme';

import LoadingScreen from '../components/LoadingScreen';
import AuthScreen from '../screens/AuthScreen';
import { HomeTab, StudyTab, TestTab, AIChatTab, ProfileTab, StudentUploadNotesScreen, StudentWatchVideosScreen, StudentUploadAssignmentScreen } from '../screens/StudentScreens';
import { StaffHomeScreen, UploadMaterialScreen, StudentsScreen, CreateTestScreen, MaterialsScreen, PerformanceScreen, StaffProfileScreen, StaffPrimaryButton } from '../screens/StaffScreens';

import { auth, db } from '../utils/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';

const BASE_API_URL = "http://192.168.0.4:8000/api/";
import { 
  getDoc, 
  doc, 
  setDoc, 
  collection, 
  onSnapshot, 
  query, 
  where,
  addDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const DataContext = React.createContext();

//-----------------------------------
// STUDENT NAVIGATION
//-----------------------------------
function StudentTabs({ handleLogout, navigation, currentUser, data, updateCurrentUser }) {
  const [tasks, setTasks] = useState([]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', data: null });
  const [inputValue, setInputValue] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Load tasks from storage
  React.useEffect(() => {
    if (currentUser) {
      const loadTasks = async () => {
        try {
          const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
          const stored = await AsyncStorage.getItem(`tasks_${currentUser.id}`);
          if (stored) setTasks(JSON.parse(stored));
        } catch (e) {}
      };
      loadTasks();
    }
  }, [currentUser]);

  // Save tasks to storage
  const saveTasks = async (newTasks) => {
    setTasks(newTasks);
    try {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      if (currentUser) await AsyncStorage.setItem(`tasks_${currentUser.id}`, JSON.stringify(newTasks));
    } catch (e) {}
  };

  const openModal = (type, taskData = null) => {
    setInputValue(taskData ? taskData.title : '');
    setModalConfig({ isOpen: true, type, data: taskData });
  };
  const closeModal = () => setModalConfig({ isOpen: false, type: '', data: null });

  const saveTask = () => {
    if (!inputValue.trim()) return;
    if (modalConfig.type === 'add_task') {
      saveTasks([...tasks, { id: Date.now().toString(), title: inputValue.trim(), completed: false }]);
    } else if (modalConfig.type === 'edit_task' && modalConfig.data) {
      saveTasks(tasks.map(t => t.id === modalConfig.data.id ? { ...t, title: inputValue.trim() } : t));
    }
    closeModal();
  };

  const toggleTask = (id) => saveTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = (id) => saveTasks(tasks.filter(t => t.id !== id));

  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarHideOnKeyboard: true,
          tabBarStyle: { display: keyboardVisible ? 'none' : 'flex', height: 70, borderTopLeftRadius: 32, borderTopRightRadius: 32, position: 'absolute', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10, borderTopWidth: 0, paddingBottom: 10, paddingTop: 10 },
          tabBarActiveTintColor: COLORS.blue500,
          tabBarInactiveTintColor: COLORS.gray400,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
        }}
      >
        <Tab.Screen 
          name="Home" 
          options={{ tabBarIcon: ({ color }) => <Home color={color} size={24} /> }}
        >
          {(props) => <HomeTab tasks={tasks} materials={data.materials} tests={data.tests} progressPercent={progressPercent} completedTasks={completedTasks} toggleTask={toggleTask} openModal={openModal} deleteTask={deleteTask} navigateToScreen={props.navigation.navigate} navigateToTab={props.navigation.navigate} currentUser={currentUser} />}
        </Tab.Screen>
        <Tab.Screen 
          name="Study" 
          options={{ tabBarIcon: ({ color }) => <Calendar color={color} size={24} /> }}
        >
          {(props) => <StudyTab tasks={tasks} materials={data.materials} tests={data.tests} openModal={openModal} toggleTask={toggleTask} deleteTask={deleteTask} />}
        </Tab.Screen>
        <Tab.Screen 
          name="AIChatPage" 
          options={{ tabBarLabel: 'AI Chat', tabBarIcon: ({ color }) => <MessageSquare color={color} size={24} /> }}
        >
          {(props) => <AIChatTab currentUser={currentUser} tests={data.tests} />}
        </Tab.Screen>
        <Tab.Screen 
          name="TestPage" 
          options={{ tabBarLabel: 'Tests', tabBarIcon: ({ color }) => <FileText color={color} size={24} /> }}
        >
          {(props) => <TestTab tests={data.tests} materials={data.materials} teachers={data.teachers} currentUser={currentUser} navigateToScreen={props.navigation.navigate} />}
        </Tab.Screen>
        <Tab.Screen 
          name="Profile" 
          options={{ tabBarIcon: ({ color }) => <UserIcon color={color} size={24} /> }}
        >
          {(props) => <ProfileTab onLogout={handleLogout} currentUser={currentUser} updateCurrentUser={updateCurrentUser} />}
        </Tab.Screen>
      </Tab.Navigator>

      {/* Task Add/Edit Modal */}
      <Modal visible={modalConfig.isOpen} transparent animationType="fade" onRequestClose={closeModal}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
              {modalConfig.type === 'add_task' ? 'Add New Task' : 'Edit Task'}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="What do you need to do?"
              autoFocus
              onSubmitEditing={saveTask}
            />
            <TouchableOpacity style={styles.modalBtn} onPress={saveTask}>
              <Text style={styles.modalBtnText}>{modalConfig.type === 'add_task' ? 'Add Task' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}


const StudentTabsContainer = (props) => {
  const ctx = React.useContext(DataContext);
  if (!ctx) return null;
  return <StudentTabs {...props} handleLogout={ctx.handleLogout} currentUser={ctx.currentUser} data={ctx.data} updateCurrentUser={ctx.updateCurrentUser} />;
};

const StudentUploadNotesContainer = (props) => {
  const ctx = React.useContext(DataContext);
  if (!ctx) return null;
  return <StudentUploadNotesScreen {...props} currentUser={ctx.currentUser} />;
};

function StudentApp({ handleLogout, currentUser, updateCurrentUser }) {
  const [data, setData] = useState({ materials: [], tests: [] });

  const fetchData = async () => {
    let materials = [];
    let tests = [];
    let teachersList = [];
    const dept = (currentUser.department || '').trim();

    // Fetch API Data
    try {
      const respMat = await fetch(`${BASE_API_URL}materials/?collegeCode=${currentUser.collegeCode}&department=${encodeURIComponent(dept)}`);
      materials = await respMat.json();
      const respTests = await fetch(`${BASE_API_URL}tests/?collegeCode=${currentUser.collegeCode}&department=${encodeURIComponent(dept)}`);
      tests = await respTests.json();
    } catch (e) {
      console.log("Fetch API error:", e.message);
    }

    // Fetch Firebase Teachers
    try {
      const teachersSnap = await getDocs(query(collection(db, 'users'), where('collegeCode', '==', currentUser.collegeCode)));
      const filteredDocs = teachersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const validRoles = ['staff', 'teacher'];
      
      teachersList = filteredDocs.filter(t => {
        const role = (t.role || '').toLowerCase();
        const tDept = (t.department || '').trim().toLowerCase();
        const isDeptMatch = !tDept || tDept === 'general' || tDept === 'all' || tDept === dept.toLowerCase();
        return validRoles.includes(role) && isDeptMatch;
      });
    } catch (e) {
      console.log("Fetch Firebase Teachers error:", e.message);
    }

    // Enrich API Data with Teacher names
    const enrichedTests = tests.map ? tests.map(test => {
      const teacher = teachersList.find(t => t.id === test.teacherId || t.uid === test.teacherId);
      return { ...test, teacherName: teacher ? teacher.fullName : 'Subject Teacher' };
    }) : [];

    const enrichedMaterials = materials.map ? materials.map(mat => {
      const teacher = teachersList.find(t => t.id === mat.teacherId || t.uid === mat.teacherId);
      return { ...mat, teacherName: teacher ? teacher.fullName : 'Subject Teacher' };
    }) : [];

    setData({ materials: enrichedMaterials, tests: enrichedTests, teachers: teachersList });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); 
    return () => clearInterval(interval);
  }, [currentUser]);

  return (
    <DataContext.Provider value={{ data, handleLogout, currentUser, updateCurrentUser }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="StudentTabs" component={StudentTabsContainer} />
        <Stack.Screen name="UploadNotes" component={StudentUploadNotesContainer} />
        <Stack.Screen name="UploadAssignment">
          {(props) => <StudentUploadAssignmentScreen {...props} currentUser={currentUser} />}
        </Stack.Screen>
        <Stack.Screen name="WatchVideos" component={StudentWatchVideosScreen} />
      </Stack.Navigator>
    </DataContext.Provider>
  );
}

//-----------------------------------
// STAFF NAVIGATION
//-----------------------------------
function StaffTabs({ handleLogout, data, commands, refreshData, currentUser, updateCurrentUser }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: { height: 70, borderTopLeftRadius: 24, borderTopRightRadius: 24, position: 'absolute', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10, borderTopWidth: 0, paddingBottom: 10, paddingTop: 10 },
        tabBarActiveTintColor: STAFF_THEME.colors.primary,
        tabBarInactiveTintColor: STAFF_THEME.colors.text.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
      }}
    >
      <Tab.Screen name="StaffHome" options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Home color={color} size={24} /> }}>
        {(props) => <StaffHomeScreen profile={data.profile} students={data.students} materials={data.materials} tests={data.tests} submissions={data.submissions || []} navigate={props.navigation.navigate} deleteTest={commands.deleteTest} />}
      </Tab.Screen>
      <Tab.Screen name="StudentsTab" options={{ tabBarLabel: 'Students', tabBarIcon: ({ color }) => <Users color={color} size={24} /> }}>
        {(props) => <StudentsScreen students={data.students} submissions={data.submissions || []} deleteStudent={commands.deleteStudent} />}
      </Tab.Screen>
      <Tab.Screen name="MaterialsTab" options={{ tabBarLabel: 'Materials', tabBarIcon: ({ color }) => <BookOpen color={color} size={24} /> }}>
        {(props) => <MaterialsScreen materials={data.materials} deleteMaterial={commands.deleteMaterial} navigate={props.navigation.navigate} />}
      </Tab.Screen>
      <Tab.Screen name="StaffProfile" options={{ tabBarLabel: 'Profile', tabBarIcon: ({ color }) => <UserIcon color={color} size={24} /> }}>
        {(props) => <StaffProfileScreen profile={data.profile} onLogout={handleLogout} currentUser={currentUser} updateCurrentUser={updateCurrentUser} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}




const StaffTabsContainer = (props) => {
  const ctx = React.useContext(DataContext);
  if (!ctx) return null;
  return <StaffTabs {...props} handleLogout={ctx.handleLogout} data={ctx.data} commands={ctx.commands} refreshData={ctx.refreshData} currentUser={ctx.currentUser} updateCurrentUser={ctx.updateCurrentUser} />;
};

const UploadMaterialContainer = (props) => {
  const ctx = React.useContext(DataContext);
  if (!ctx) return null;
  return <UploadMaterialScreen addMaterial={async (m) => { await ctx.commands.addMaterial(m); await ctx.refreshData(); }} goBack={props.navigation.goBack} />;
};

const CreateTestContainer = (props) => {
  const ctx = React.useContext(DataContext);
  if (!ctx) return null;
  return <CreateTestScreen addTest={ctx.commands.addTest} goBack={props.navigation.goBack} />;
};

const PerformanceContainer = (props) => {
  const ctx = React.useContext(DataContext);
  if (!ctx) return null;
  return <PerformanceScreen students={ctx.data.students} submissions={ctx.data.submissions || []} goBack={props.navigation.goBack} />;
};

function StaffApp({ handleLogout, currentUser, updateCurrentUser }) {
  const [data, setData] = useState({
    profile: { name: currentUser.fullName, subject: currentUser.department || 'General', role: 'Staff Educator' },
    students: [], materials: [], tests: [], submissions: []
  });

  const fetchData = async () => {
    try {
      const dept = (currentUser.department || '').trim();
      const respMat = await fetch(`${BASE_API_URL}materials/?collegeCode=${currentUser.collegeCode}&department=${encodeURIComponent(dept)}`);
      const materials = await respMat.json();
      const respTests = await fetch(`${BASE_API_URL}tests/?collegeCode=${currentUser.collegeCode}&department=${encodeURIComponent(dept)}`);
      const tests = await respTests.json();
      const respSubs = await fetch(`${BASE_API_URL}submissions/?collegeCode=${currentUser.collegeCode}&department=${encodeURIComponent(dept)}`);
      const submissions = await respSubs.json();
      setData(prev => ({ ...prev, materials, tests, submissions }));
    } catch (e) {}
  };

  useEffect(() => {
    fetchData();
    const dept = (currentUser.department || '').trim();
    const cCode = (currentUser.collegeCode || '').trim();
    const cName = (currentUser.collegeName || '').trim();
    
    console.log('Teacher filter → collegeCode:', cCode, 'collegeName:', cName, 'department:', dept);
    
    // Use only role + collegeCode in the Firestore query (avoids needing a composite index)
    // Then filter collegeName and department on the client side
    const qStudents = query(
      collection(db, 'users'), 
      where('role', '==', 'Student'),
      where('collegeCode', '==', cCode)
    );
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      const allStudents = snapshot.docs.map(d => {
        const sd = d.data();
        return {
          id: d.id, 
          name: sd.fullName || 'Unknown', 
          email: sd.email || '',
          department: (sd.department || '').trim(),
          collegeName: (sd.collegeName || '').trim(),
          registerNumber: sd.registerNumber || '',
          score: 85, 
          avatar: sd.fullName ? sd.fullName.charAt(0).toUpperCase() : '?'
        };
      });
      
      console.log('All students from Firestore for collegeCode=' + cCode + ':', allStudents.length);
      allStudents.forEach(s => console.log(' -', s.name, '| dept:', s.department, '| college:', s.collegeName));
      
      // Client-side filter for department and collegeName
      const filtered = allStudents.filter(s => {
        const deptMatch = !dept || s.department.toLowerCase() === dept.toLowerCase();
        const nameMatch = !cName || s.collegeName.toLowerCase() === cName.toLowerCase();
        return deptMatch && nameMatch;
      });
      
      console.log('After department+collegeName filter:', filtered.length);
      
      setData(prev => ({ ...prev, students: filtered }));
    }, (error) => {
      console.log('Students query error:', error.message);
    });

    return () => unsubStudents();
  }, [currentUser]);

  const commands = {
    addMaterial: async (material) => {
      try {
        const dept = (currentUser.department || '').trim();
        const formData = new FormData();
        formData.append('teacherId', currentUser.uid || currentUser.id || 'unknown_teacher');
        formData.append('collegeName', currentUser.collegeName);
        formData.append('collegeCode', currentUser.collegeCode);
        formData.append('department', dept);
        formData.append('title', material.title);
        formData.append('description', material.desc || '');
        formData.append('file_type', material.type || 'PDF');
        formData.append('size', material.size || '0 MB');

        if (material.uri) {
          formData.append('file', {
            uri: material.uri,
            name: material.fileName || 'document.pdf',
            type: material.mimeType || 'application/pdf',
          });
        }

        const response = await fetch(`${BASE_API_URL}materials/`, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }

        fetchData();
      } catch (e) { throw e; }
    },
    deleteMaterial: async (id) => {
      await fetch(`${BASE_API_URL}materials/${id}/`, { method: 'DELETE' });
      fetchData();
    },
    addTest: async (test) => {
      const dept = (currentUser.department || '').trim();
      const body = {
        teacherId: currentUser.uid || currentUser.id || 'unknown_teacher',
        collegeName: currentUser.collegeName,
        collegeCode: currentUser.collegeCode,
        department: dept,
        title: test.title,
        duration: test.duration,
        questions_count: test.questions ? test.questions.length : 0,
        questions: test.questions || []
      };
      try {
        const resp = await fetch(`${BASE_API_URL}tests/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!resp.ok) {
          const errText = await resp.text();
          console.log('Test create error:', errText);
        }
      } catch (e) {
        console.log('Test create network error:', e.message);
      }
      fetchData();
    },
    deleteTest: async (id) => {
      try {
        await fetch(`${BASE_API_URL}tests/${id}/`, { method: 'DELETE' });
        fetchData();
      } catch (e) {
        console.log('Delete test error:', e.message);
      }
    },
    deleteStudent: (id) => {} 
  };

  return (
    <DataContext.Provider value={{ data, commands, handleLogout, currentUser, updateCurrentUser, refreshData: fetchData }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="StaffTabs" component={StaffTabsContainer} />
        <Stack.Screen name="UploadMaterial" component={UploadMaterialContainer} />
        <Stack.Screen name="CreateTest" component={CreateTestContainer} />
        <Stack.Screen name="Performance" component={PerformanceContainer} />
      </Stack.Navigator>
    </DataContext.Provider>
  );
}

//-----------------------------------
// MAIN APP ROUTER
//-----------------------------------
export default function AppNavigator() {
  const [appState, setAppState] = useState('loading'); 
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const rawData = userDoc.data();
          const trimmedData = {};
          for (let key in rawData) {
            trimmedData[key] = typeof rawData[key] === 'string' ? rawData[key].trim() : rawData[key];
          }
          const userData = { id: user.uid, ...trimmedData };
          setCurrentUser(userData);
          setAppState(userData.role === 'Student' ? 'student' : 'staff');
        } else {
          setAppState('auth');
        }
      } else {
        setAppState('auth');
      }
    });
    return unsub;
  }, []);

  const handleLogin = async (role, formData, mode) => {
    setAppState('loading');
    try {
      if (mode === 'signup') {
        const res = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const { password, confirmPassword, ...rest } = formData;
        const cleanRest = {};
        for (let key in rest) {
          cleanRest[key] = typeof rest[key] === 'string' ? rest[key].trim() : rest[key];
        }
        const profileData = { 
          role, 
          ...cleanRest,
          email: formData.email,
          createdAt: new Date().toISOString() 
        };
        await setDoc(doc(db, 'users', res.user.uid), profileData);
        // Login handled by onAuthStateChanged
      } else {
        // Mode is signin
        // Firebase Auth uses email. If student provides registerNumber, we need to map or just use the provided email fields.
        // For simplicity, we ensure formData has email even for students during signin if they registered with it.
        // If they registered with registerNumber but Firebase requires email, we'd normally use a mapping.
        // Assuming user provides valid email on signin since we added it to form fields.
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
    } catch(e) {
      alert(e.message);
      setAppState('auth');
    }
  };

  const handleLogout = async () => {
    setAppState('loading');
    try {
      await signOut(auth);
      setCurrentUser(null);
      setAppState('auth');
    } catch(e) {
      setAppState('auth');
    }
  };

  const updateCurrentUser = (newData) => {
    setCurrentUser(prev => ({ ...prev, ...newData }));
  };

  return (
    <NavigationContainer>
      {appState === 'loading' ? (
        <LoadingScreen />
      ) : appState === 'auth' ? (
        <AuthScreen onLogin={handleLogin} />
      ) : appState === 'student' ? (
        <StudentApp handleLogout={handleLogout} currentUser={currentUser} updateCurrentUser={updateCurrentUser} />
      ) : (
        <StaffApp handleLogout={handleLogout} currentUser={currentUser} updateCurrentUser={updateCurrentUser} />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#FFF', padding: 24, borderRadius: 24 },
  modalInput: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 24 },
  modalBtn: { backgroundColor: COLORS.blue500, padding: 16, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
