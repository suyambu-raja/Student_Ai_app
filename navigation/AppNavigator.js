import React, { useState } from 'react';
import { View, StyleSheet, Modal, TextInput, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar, MessageSquare, FileText, User as UserIcon, Users, BookOpen } from 'lucide-react-native';
import { COLORS, STAFF_THEME } from '../utils/theme';

import LoadingScreen from '../components/LoadingScreen';
import AuthScreen from '../screens/AuthScreen';
import { HomeTab, StudyTab, TestTab, AIChatTab, ProfileTab, StudentUploadNotesScreen, StudentWatchVideosScreen } from '../screens/StudentScreens';
import { StaffHomeScreen, UploadMaterialScreen, StudentsScreen, CreateTestScreen, MaterialsScreen, PerformanceScreen, StaffProfileScreen, StaffPrimaryButton } from '../screens/StaffScreens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const STUDENT_TASKS_INITIAL = [
  { id: 1, title: 'Revise Calculus', completed: true },
  { id: 2, title: 'Solve 30 Qs', completed: false },
  { id: 3, title: 'Take Physics Test', completed: false }
];

const STAFF_INITIAL_DATA = {
  profile: { name: 'Prof. Sarah Jenkins', subject: 'Mathematics', role: 'Senior Educator' },
  students: [
    { id: '1', name: 'Alex Johnson', grade: 'A', score: 92, avatar: 'AJ' },
    { id: '2', name: 'Maria Garcia', grade: 'B', score: 78, avatar: 'MG' },
    { id: '3', name: 'James Smith', grade: 'C', score: 65, avatar: 'JS' },
    { id: '4', name: 'Linda Chen', grade: 'A', score: 95, avatar: 'LC' },
  ],
  materials: [
    { id: '1', title: 'Calculus Chapter 4', type: 'PDF', date: 'Oct 15', size: '2.4 MB' },
    { id: '2', title: 'Algebra Practice Set', type: 'DOC', date: 'Oct 18', size: '1.1 MB' },
  ],
  tests: [
    { id: '1', title: 'Midterm: Calculus', date: 'Oct 25', duration: '60m', questions: 30, status: 'Upcoming' },
    { id: '2', title: 'Quiz: Derivatives', date: 'Oct 10', duration: '30m', questions: 15, status: 'Completed' },
  ]
};

//-----------------------------------
// STUDENT NAVIGATION
//-----------------------------------
function StudentTabs({ handleLogout, navigation }) {
  const [tasks, setTasks] = useState(STUDENT_TASKS_INITIAL);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', data: null });
  const [inputValue, setInputValue] = useState('');

  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

  const openModal = (type, data = null) => {
    setInputValue(data ? data.title : '');
    setModalConfig({ isOpen: true, type, data });
  };
  const closeModal = () => setModalConfig({ isOpen: false, type: '', data: null });

  const saveTask = () => {
    if (!inputValue.trim()) return;
    if (modalConfig.type === 'add_task') {
      setTasks([...tasks, { id: Date.now(), title: inputValue, completed: false }]);
    } else if (modalConfig.type === 'edit_task') {
      setTasks(tasks.map(t => t.id === modalConfig.data.id ? { ...t, title: inputValue } : t));
    }
    closeModal();
  };
  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));
  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: { height: 70, borderTopLeftRadius: 32, borderTopRightRadius: 32, position: 'absolute', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10, borderTopWidth: 0, paddingBottom: 10, paddingTop: 10 },
          tabBarActiveTintColor: COLORS.blue500,
          tabBarInactiveTintColor: COLORS.gray400,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
        }}
      >
        <Tab.Screen 
          name="Home" 
          options={{ tabBarIcon: ({ color }) => <Home color={color} size={24} /> }}
        >
          {() => <HomeTab tasks={tasks} progressPercent={progressPercent} completedTasks={completedTasks} toggleTask={toggleTask} openModal={openModal} deleteTask={deleteTask} navigateToScreen={(s) => navigation.navigate(s)} navigateToTab={(t) => navigation.navigate(t)} />}
        </Tab.Screen>
        <Tab.Screen 
          name="Study" 
          options={{ tabBarIcon: ({ color }) => <Calendar color={color} size={24} /> }}
        >
          {() => <StudyTab tasks={tasks} openModal={openModal} toggleTask={toggleTask} deleteTask={deleteTask} />}
        </Tab.Screen>
        <Tab.Screen 
          name="AI" 
          options={{ tabBarLabel: 'AI Chat', tabBarIcon: ({ color }) => <MessageSquare color={color} size={24} /> }}
        >
          {() => <AIChatTab />}
        </Tab.Screen>
        <Tab.Screen 
          name="Test" 
          options={{ tabBarIcon: ({ color }) => <FileText color={color} size={24} /> }}
        >
          {() => <TestTab />}
        </Tab.Screen>
        <Tab.Screen 
          name="Profile" 
          options={{ tabBarIcon: ({ color }) => <UserIcon color={color} size={24} /> }}
        >
          {() => <ProfileTab onLogout={handleLogout} />}
        </Tab.Screen>
      </Tab.Navigator>

      <Modal visible={modalConfig.isOpen} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TextInput style={styles.modalInput} value={inputValue} onChangeText={setInputValue} placeholder="e.g. Read Chapter 5" autoFocus />
            <TouchableOpacity style={styles.modalBtn} onPress={saveTask}>
              <Text style={styles.modalBtnText}>{modalConfig.type === 'edit_task' ? 'Save' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function StudentApp({ handleLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentTabs">
        {(props) => <StudentTabs {...props} handleLogout={handleLogout} />}
      </Stack.Screen>
      <Stack.Screen name="UploadNotes" component={StudentUploadNotesScreen} />
      <Stack.Screen name="WatchVideos" component={StudentWatchVideosScreen} />
    </Stack.Navigator>
  );
}

//-----------------------------------
// STAFF NAVIGATION
//-----------------------------------
function StaffTabs({ handleLogout, navigation, data, commands }) {
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
        {() => <StaffHomeScreen profile={data.profile} students={data.students} materials={data.materials} tests={data.tests} navigate={(s) => navigation.navigate(s)} />}
      </Tab.Screen>
      <Tab.Screen name="StudentsTab" options={{ tabBarLabel: 'Students', tabBarIcon: ({ color }) => <Users color={color} size={24} /> }}>
        {() => <StudentsScreen students={data.students} deleteStudent={commands.deleteStudent} />}
      </Tab.Screen>
      <Tab.Screen name="MaterialsTab" options={{ tabBarLabel: 'Materials', tabBarIcon: ({ color }) => <BookOpen color={color} size={24} /> }}>
        {() => <MaterialsScreen materials={data.materials} deleteMaterial={commands.deleteMaterial} navigate={(s) => navigation.navigate(s)} />}
      </Tab.Screen>
      <Tab.Screen name="StaffProfile" options={{ tabBarLabel: 'Profile', tabBarIcon: ({ color }) => <UserIcon color={color} size={24} /> }}>
        {() => <StaffProfileScreen profile={data.profile} onLogout={handleLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function StaffApp({ handleLogout }) {
  const [data, setData] = useState(STAFF_INITIAL_DATA);
  const commands = {
    addStudent: (student) => setData(p => ({ ...p, students: [...p.students, { ...student, id: Date.now().toString() }] })),
    deleteStudent: (id) => setData(p => ({ ...p, students: p.students.filter(s => s.id !== id) })),
    addMaterial: (material) => setData(p => ({ ...p, materials: [{ ...material, id: Date.now().toString(), date: 'Just now' }, ...p.materials] })),
    deleteMaterial: (id) => setData(p => ({ ...p, materials: p.materials.filter(m => m.id !== id) })),
    addTest: (test) => setData(p => ({ ...p, tests: [{ ...test, id: Date.now().toString(), status: 'Upcoming' }, ...p.tests] })),
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StaffTabs">
        {(props) => <StaffTabs {...props} handleLogout={handleLogout} data={data} commands={commands} />}
      </Stack.Screen>
      <Stack.Screen name="UploadMaterial">
        {(props) => <UploadMaterialScreen addMaterial={commands.addMaterial} goBack={props.navigation.goBack} />}
      </Stack.Screen>
      <Stack.Screen name="CreateTest">
        {(props) => <CreateTestScreen addTest={commands.addTest} goBack={props.navigation.goBack} />}
      </Stack.Screen>
      <Stack.Screen name="Performance">
        {(props) => <PerformanceScreen students={data.students} goBack={props.navigation.goBack} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

//-----------------------------------
// MAIN APP ROUTER
//-----------------------------------
export default function AppNavigator() {
  const [appState, setAppState] = useState('auth'); // auth, loading, student, staff

  const handleLogin = (role) => {
    setAppState('loading');
    setTimeout(() => {
      setAppState(role === 'Student' ? 'student' : 'staff');
    }, 1500);
  };

  const handleLogout = () => {
    setAppState('loading');
    setTimeout(() => {
      setAppState('auth');
    }, 800);
  };

  return (
    <NavigationContainer>
      {appState === 'loading' ? (
        <LoadingScreen />
      ) : appState === 'auth' ? (
        <AuthScreen onLogin={handleLogin} />
      ) : appState === 'student' ? (
        <StudentApp handleLogout={handleLogout} />
      ) : (
        <StaffApp handleLogout={handleLogout} />
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
