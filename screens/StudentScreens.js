import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Modal, KeyboardAvoidingView, Platform, Linking, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrainCircuit, CheckCircle2, Circle, Plus, Trash2, Edit2, PlayCircle, Upload, FileText, UploadCloud, ChevronLeft, Check, Clock, Send, User, Paperclip, X, BookOpen, Award, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { COLORS } from '../utils/theme';
import { db } from '../utils/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import * as DocumentPicker from 'expo-document-picker';

const BASE_API_URL = "http://192.168.0.4:8000/api/";

export const handleOpenMaterial = async (url, title, extension) => {
  if (!url) return;
  try {
    const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.${extension || 'pdf'}`.toLowerCase();
    const downloadDest = FileSystem.cacheDirectory + fileName;
    const { uri, status } = await FileSystem.downloadAsync(url, downloadDest);
    
    if (status !== 200) {
      alert("Failed to download file.");
      return;
    }

    if (Platform.OS === 'android') {
      try {
        const cURI = await FileSystem.getContentUriAsync(uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: cURI,
          flags: 1,
        });
      } catch (e) {
        await Sharing.shareAsync(uri);
      }
    } else {
      await Sharing.shareAsync(uri);
    }
  } catch (e) {
    alert("Could not open file: " + e.message);
  }
};

export function QuickActionBtn({ icon: Icon, label, bgColors, onPress }) {
  return (
    <TouchableOpacity style={styles.quickActionGroup} onPress={onPress}>
      <LinearGradient colors={bgColors} style={styles.quickActionBtn}>
        <Icon color="#FFF" size={32} />
      </LinearGradient>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function HomeTab({ tasks, materials, tests, progressPercent, completedTasks, toggleTask, openModal, deleteTask, navigateToScreen, navigateToTab, currentUser }) {
  const upcomingTest = tests && tests.length > 0 ? tests[0] : null;

  return (
    <ScrollView style={styles.tabContainer} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <View style={styles.p6}>
        <View style={styles.headerRow}>
          <View>
            <View style={styles.aiPrepLabel}>
              <BrainCircuit color={COLORS.blue600} size={20} />
              <Text style={styles.aiPrepText}> AI Prep</Text>
            </View>
            <Text style={styles.greeting}>Hello{currentUser?.fullName ? `, ${currentUser.fullName.split(' ')[0]}` : ''}!</Text>
          </View>
          <View style={styles.profilePicWrapper}>
            <View style={[styles.profilePic, { backgroundColor: COLORS.blue500, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '700' }}>{currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'S'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardMain}>
          <View style={styles.blurCircle} />
          <Text style={styles.examTitle}>{upcomingTest ? upcomingTest.title : 'No Upcoming Tests'}</Text>
          {upcomingTest && <Text style={{ fontSize: 14, color: COLORS.gray500, fontWeight: '500', marginTop: 4 }}>By {upcomingTest.teacherName}</Text>}
          <View style={styles.examDaysRow}>
            <Text style={styles.examDaysNum}>{tests ? tests.length : 0}</Text>
            <Text style={styles.examDaysLabel}>{tests && tests.length === 1 ? 'test' : 'tests'} available</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Preparation</Text>
              <Text style={styles.progressLabel}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <LinearGradient colors={[COLORS.cyan400, COLORS.blue500]} style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </View>

        <View style={[styles.cardSecondary, { marginBottom: 24 }]}>
          <Text style={[styles.cardTitle, { marginBottom: 16 }]}>Shared Materials</Text>
          {materials && materials.length > 0 ? (
            materials.slice(0, 3).map(m => (
              <TouchableOpacity key={m.id} style={[styles.taskItem, { marginBottom: 12 }]} onPress={() => handleOpenMaterial(m.file_download_url || m.fileUrl, m.title, m.file_type)}>
                <FileText color={COLORS.blue500} size={20} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', color: COLORS.gray800 }}>{m.title}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.gray500 }}>{m.file_type} • By {m.teacherName} • {m.date_created ? new Date(m.date_created).toLocaleDateString() : ''}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No materials shared by your teacher yet.</Text>
          )}
        </View>

        <View style={styles.cardSecondary}>
          <View style={styles.cardHeaderFlex}>
            <Text style={styles.cardTitle}>Today's Plan</Text>
            <TouchableOpacity onPress={() => openModal('add_task')} style={styles.addBtnContainer}>
              <Plus color={COLORS.blue500} size={20} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.tasksList}>
            {tasks.length === 0 ? (
              <Text style={styles.emptyText}>No tasks for today. Add one!</Text>
            ) : (
              tasks.map(task => (
                <View key={task.id} style={styles.taskItem}>
                  <TouchableOpacity onPress={() => toggleTask(task.id)} style={styles.taskCheckbox}>
                    {task.completed ? <CheckCircle2 color={COLORS.cyan500} size={24} /> : <Circle color={COLORS.gray300} size={24} />}
                  </TouchableOpacity>
                  <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>{task.title}</Text>
                  <View style={styles.taskActions}>
                    <TouchableOpacity onPress={() => openModal('edit_task', task)} style={styles.actionBtn}>
                      <Edit2 color={COLORS.gray400} size={16} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteTask(task.id)} style={styles.actionBtn}>
                      <Trash2 color={COLORS.gray400} size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

export function StudyTab({ tasks, materials, tests, openModal, toggleTask, deleteTask }) {
  return (
    <ScrollView style={styles.tabContainer} contentContainerStyle={styles.p6}>
      <Text style={styles.pageTitle}>Study Resources</Text>
      
      <Text style={[styles.sectionTitle, { marginLeft: 0, marginTop: 16 }]}>Teacher Materials</Text>
      <View style={{ marginBottom: 24 }}>
        {materials && materials.length > 0 ? (
          materials.map(m => (
            <TouchableOpacity key={m.id} style={styles.taskCardBox} onPress={() => handleOpenMaterial(m.file_download_url || m.fileUrl, m.title, m.file_type)}>
              <View style={styles.taskCardLeft}>
                <BookOpen color={COLORS.blue500} size={24} />
                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Text style={styles.taskCardTitle}>{m.title}</Text>
                  <Text style={styles.taskCardStatusText}>{m.file_type} • By {m.teacherName} • Shared on {m.date_created ? new Date(m.date_created).toLocaleDateString() : ''}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No materials shared yet.</Text>
        )}
      </View>

      <View style={styles.cardHeaderFlex}>
        <Text style={styles.cardTitle}>My Tasks</Text>
        <TouchableOpacity onPress={() => openModal('add_task')} style={styles.addBtnPill}>
          <Text style={styles.addBtnPillText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 32 }}>
        {tasks.length === 0 ? (
          <Text style={styles.emptyText}>No tasks yet. Add one to stay organized!</Text>
        ) : (
          tasks.map((task) => (
            <View key={task.id} style={styles.taskCardBox}>
              <View style={styles.taskCardLeft}>
                <TouchableOpacity onPress={() => toggleTask(task.id)}>
                  {task.completed ? <CheckCircle2 color={COLORS.cyan500} size={24} /> : <Circle color={COLORS.gray300} size={24} />}
                </TouchableOpacity>
                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Text style={[styles.taskCardTitle, task.completed && styles.taskTitleDone]}>{task.title}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => openModal('edit_task', task)} style={{ padding: 8 }}>
                  <Edit2 color={COLORS.gray400} size={18} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteTask(task.id)} style={{ padding: 8 }}>
                  <Trash2 color={COLORS.gray400} size={18} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// =============================================
// TEST TAB - Shows teacher tests, students answer
// =============================================
export function TestTab({ tests, materials = [], teachers, currentUser, navigateToScreen }) {
  const [expandedTeacherId, setExpandedTeacherId] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completedTests, setCompletedTests] = useState([]);

  useEffect(() => {
    fetchCompletedTests();
  }, [currentUser]);

  const fetchCompletedTests = async () => {
    if (!currentUser) return;
    try {
      const resp = await fetch(`${BASE_API_URL}submissions/?studentId=${currentUser.id}`);
      const data = await resp.json();
      setCompletedTests(data);
    } catch (e) {}
  };

  const startTest = (test) => {
    if (!test.questions || test.questions.length === 0) {
      Alert.alert('No Questions', 'This test has no questions yet.');
      return;
    }
    setSelectedTest(test);
    setCurrentQ(0);
    setAnswers({});
    setIsFinished(false);
    setScore(0);
  };

  const selectAnswer = (qId, answer) => {
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const submitTest = async () => {
    if (!selectedTest) return;
    setSubmitting(true);
    let correct = 0;
    const questions = selectedTest.questions;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) correct++;
    });
    setScore(correct);

    try {
      await fetch(`${BASE_API_URL}submissions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test: selectedTest.id,
          studentId: currentUser?.id || '',
          studentName: currentUser?.fullName || '',
          collegeCode: currentUser?.collegeCode || '',
          department: (currentUser?.department || '').trim(),
          score: correct,
          total: questions.length,
          answers: answers,
        })
      });
      fetchCompletedTests();
    } catch (e) {}
    setSubmitting(false);
    setIsFinished(true);
  };

  const isTestCompleted = (testId) => completedTests.some(s => s.test === testId);
  const getTestScore = (testId) => {
    const sub = completedTests.find(s => s.test === testId);
    return sub ? `${sub.score}/${sub.total}` : null;
  };

  // Result screen
  if (isFinished && selectedTest) {
    const total = selectedTest.questions.length;
    const pct = Math.round((score / total) * 100);
    return (
      <View style={styles.testFinishedContainer}>
        <View style={[styles.testFinishedIcon, { backgroundColor: pct >= 50 ? '#D1FAE5' : '#FEE2E2' }]}>
          {pct >= 50 ? <Award color="#059669" size={48} /> : <X color="#DC2626" size={48} />}
        </View>
        <Text style={styles.testFinishedTitle}>Test Completed!</Text>
        <Text style={{ fontSize: 48, fontWeight: '800', color: pct >= 50 ? '#059669' : '#DC2626', marginBottom: 8 }}>{pct}%</Text>
        <Text style={{ fontSize: 16, color: COLORS.gray500, marginBottom: 32 }}>{score} out of {total} correct</Text>
        <TouchableOpacity style={styles.retakeBtn} onPress={() => { setSelectedTest(null); setIsFinished(false); }}>
          <Text style={styles.retakeBtnText}>Back to Tests</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Taking a test
  if (selectedTest && selectedTest.questions && selectedTest.questions.length > 0) {
    const questions = selectedTest.questions;
    const q = questions[currentQ];
    const opts = [
      { key: 'A', text: q.option_a },
      { key: 'B', text: q.option_b },
      { key: 'C', text: q.option_c },
      { key: 'D', text: q.option_d },
    ];

    return (
      <View style={styles.tabContainer}>
        <View style={styles.testHeader}>
          <View style={styles.cardHeaderFlex}>
            <TouchableOpacity onPress={() => { Alert.alert('Quit Test?', 'Your progress will be lost.', [{ text: 'Cancel' }, { text: 'Quit', onPress: () => setSelectedTest(null), style: 'destructive' }]); }}>
              <ChevronLeft color={COLORS.gray900} size={24} />
            </TouchableOpacity>
            <Text style={[styles.pageTitle, { flex: 1, textAlign: 'center', marginBottom: 0 }]}>{selectedTest.title}</Text>
            <View style={styles.timerPill}><Text style={styles.timerText}>{selectedTest.duration}</Text></View>
          </View>
          <Text style={[styles.pageSubtitle, { textAlign: 'center' }]}>Question {currentQ + 1} of {questions.length}</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            {questions.map((_, i) => (
              <View key={i} style={{ flex: 1, height: 4, backgroundColor: i <= currentQ ? COLORS.blue500 : COLORS.gray200, marginHorizontal: 2, borderRadius: 2 }} />
            ))}
          </View>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 24 }}>
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{q.question_text}</Text>
            <View style={{ marginTop: 24 }}>
              {opts.map((opt) => {
                const active = answers[q.id] === opt.key;
                return (
                  <TouchableOpacity 
                     key={opt.key} 
                     style={[styles.answerOption, active && styles.answerOptionActive]}
                     onPress={() => selectAnswer(q.id, opt.key)}
                  >
                    <View style={[styles.answerOptionLetter, active && styles.answerOptionLetterActive]}>
                      <Text style={[styles.answerOptionLetterText, active && styles.answerOptionLetterTextActive]}>{opt.key}</Text>
                    </View>
                    <Text style={[styles.answerOptionText, active && styles.answerOptionTextActive]}>{opt.text}</Text>
                    {active && <CheckCircle2 color={COLORS.blue500} size={20} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.testFooter, { paddingBottom: 100 }]}>
          <TouchableOpacity disabled={currentQ === 0} onPress={() => setCurrentQ(c => c - 1)} style={[styles.testNavBtn, currentQ === 0 ? styles.testNavBtnDisabled : styles.testNavBtnPrev]}>
            <Text style={[styles.testNavBtnText, currentQ === 0 ? styles.testNavBtnTextDisabled : styles.testNavBtnPrevText]}>Previous</Text>
          </TouchableOpacity>
          {currentQ === questions.length - 1 ? (
            <TouchableOpacity onPress={submitTest} disabled={submitting} style={[styles.testNavBtn, { backgroundColor: '#059669' }]}>
              <Text style={[styles.testNavBtnText, { color: '#FFF' }]}>{submitting ? 'Submitting...' : 'Submit Test'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setCurrentQ(c => c + 1)} style={[styles.testNavBtn, styles.testNavBtnNext]}>
              <Text style={[styles.testNavBtnText, styles.testNavBtnNextText]}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Test list & Teacher selection Accordion
  return (
    <ScrollView style={styles.tabContainer} contentContainerStyle={styles.p6}>
      <Text style={styles.pageTitle}>Subject Teachers</Text>
      <Text style={[styles.pageSubtitle, { marginBottom: 24 }]}>Select a teacher to view tests and assignments</Text>
      
      {(!teachers || teachers.length === 0) ? (
        <View style={{ alignItems: 'center', marginTop: 60 }}>
          <User color={COLORS.gray300} size={64} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.gray400 }}>No teachers found</Text>
          <Text style={{ fontSize: 14, color: COLORS.gray400, marginTop: 4 }}>Teachers from your department will appear here.</Text>
        </View>
      ) : (
        teachers.map(teacher => {
          const isExpanded = expandedTeacherId === teacher.id || expandedTeacherId === teacher.uid;
          const teacherTests = tests?.filter(t => t.teacherId === teacher.id || t.teacherId === teacher.uid) || [];
          const teacherMaterials = materials?.filter(m => m.teacherId === teacher.id || m.teacherId === teacher.uid) || [];
          
          return (
            <View key={teacher.id} style={{ marginBottom: 16 }}>
              <TouchableOpacity style={[styles.taskCardBox, { marginBottom: isExpanded ? 8 : 0, borderColor: isExpanded ? COLORS.blue500 : COLORS.gray200, backgroundColor: isExpanded ? '#F8FAFC' : '#FFF' }]} onPress={() => setExpandedTeacherId(isExpanded ? null : (teacher.id || teacher.uid))}>
                <View style={styles.taskCardLeft}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.blue100, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: COLORS.blue600, fontSize: 20, fontWeight: '700' }}>{teacher.fullName?.charAt(0) || 'T'}</Text>
                  </View>
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text style={[styles.taskCardTitle, isExpanded && { color: COLORS.blue700 }]}>{teacher.fullName}</Text>
                    <Text style={styles.taskCardStatusText}>{teacher.email}</Text>
                  </View>
                </View>
                <ChevronRight color={isExpanded ? COLORS.blue600 : COLORS.gray400} size={20} style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }} />
              </TouchableOpacity>

              {isExpanded && (
                <View style={{ paddingLeft: 16, marginBottom: 16, paddingRight: 8, borderLeftWidth: 2, borderColor: COLORS.blue200, marginLeft: 24, paddingTop: 8 }}>
                  
                  {/* Assignment Materials */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <BookOpen color={COLORS.gray700} size={16} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.gray700, marginLeft: 8 }}>Assignment Materials</Text>
                  </View>
                  
                  {teacherMaterials.length === 0 ? (
                    <Text style={{ fontStyle: 'italic', color: COLORS.gray400, marginBottom: 16, fontSize: 13 }}>No materials uploaded.</Text>
                  ) : (
                    teacherMaterials.map(mat => (
                      <TouchableOpacity key={mat.id} style={styles.inlineCardBox} onPress={() => handleOpenMaterial(mat.file_download_url || mat.fileUrl, mat.title, mat.file_type)}>
                        <View style={styles.taskCardLeft}>
                          <FileText color={COLORS.blue400} size={18} />
                          <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.gray800 }}>{mat.title}</Text>
                            <Text style={{ fontSize: 12, color: COLORS.gray500 }}>{mat.file_type}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}

                  {/* Tests */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 8 }}>
                    <CheckCircle2 color={COLORS.gray700} size={16} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.gray700, marginLeft: 8 }}>Tests</Text>
                  </View>
                  
                  {teacherTests.length === 0 ? (
                    <Text style={{ fontStyle: 'italic', color: COLORS.gray400, marginBottom: 16, fontSize: 13 }}>No tests available.</Text>
                  ) : (
                    teacherTests.map(test => {
                      const completed = isTestCompleted(test.id);
                      const scoreText = getTestScore(test.id);
                      return (
                        <TouchableOpacity key={test.id} style={[styles.inlineCardBox, completed && { borderColor: '#D1FAE5', borderWidth: 2 }]} onPress={() => startTest(test)}>
                          <View style={styles.taskCardLeft}>
                            <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: completed ? '#D1FAE5' : '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                              {completed ? <Check color="#059669" size={18} /> : <FileText color={COLORS.blue500} size={18} />}
                            </View>
                            <View style={{ marginLeft: 12, flex: 1 }}>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.gray800 }}>{test.title}</Text>
                              <Text style={{ fontSize: 12, color: COLORS.gray500 }}>{test.duration}</Text>
                            </View>
                            {completed && <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669', marginTop: 2 }}>{scoreText}</Text>}
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}

                  <TouchableOpacity style={[styles.addBtnPill, { alignSelf: 'flex-start', marginTop: 8, backgroundColor: COLORS.blue50, flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16 }]} onPress={() => navigateToScreen('UploadAssignment', { teacherId: teacher.id, teacherName: teacher.fullName })}>
                    <UploadCloud color={COLORS.blue500} size={18} style={{ marginRight: 6 }} />
                    <Text style={[styles.addBtnPillText, { fontSize: 14 }]}>Upload Submission</Text>
                  </TouchableOpacity>

                </View>
              )}
            </View>
          );
        })
      )}

      {completedTests.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <Text style={[styles.cardTitle, { marginBottom: 16 }]}>My Completed Tests</Text>
          {completedTests.map(sub => (
            <View key={sub.id} style={[styles.taskCardBox, { borderLeftWidth: 4, borderLeftColor: '#059669' }]}>
              <View style={styles.taskCardLeft}>
                <Award color="#059669" size={24} />
                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Text style={styles.taskCardTitle}>{sub.test_title || 'Test'}</Text>
                  <Text style={styles.taskCardStatusText}>Score: {sub.score}/{sub.total} • {new Date(sub.submitted_at).toLocaleDateString()}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// =============================================
// AI CHAT TAB - Uses Google Gemini API
// =============================================
const GEMINI_API_KEY = "AIzaSyDnRqUWyH6Dh65WP4ilvdgNzp88ioDjEDM";

const TypingDots = () => {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const interval = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(interval);
  }, []);
  return <Text style={{ fontSize: 24, color: '#6B7280', letterSpacing: 2 }}>{dots || '.'}</Text>;
};

const ChatMessage = ({ msg, currentUser }) => {
  const isUser = msg.sender === 'user';
  const time = msg.id ? new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  
  return (
    <View style={{ flexDirection: 'row', marginBottom: 20, justifyContent: isUser ? 'flex-end' : 'flex-start', paddingHorizontal: 16 }}>
      {!isUser && (
        <LinearGradient colors={['#7C3AED', '#4F46E5']} style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 4 }}>
          <BrainCircuit color="#FFF" size={16} />
        </LinearGradient>
      )}
      <View style={{ maxWidth: '78%' }}>
        <View style={{
          padding: 14, borderRadius: 18,
          backgroundColor: isUser ? '#2563EB' : '#F3F4F6',
          borderTopRightRadius: isUser ? 4 : 18,
          borderTopLeftRadius: isUser ? 18 : 4,
        }}>
          <Text style={{ fontSize: 15, lineHeight: 22, color: isUser ? '#FFF' : '#1F2937' }} selectable>{msg.text}</Text>
        </View>
        <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>{time}</Text>
      </View>
      {isUser && (
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginLeft: 10, marginTop: 4 }}>
          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>{currentUser?.fullName?.charAt(0)?.toUpperCase() || 'U'}</Text>
        </View>
      )}
    </View>
  );
};

export function AIChatTab({ currentUser, tests }) {
  const [chatMessages, setChatMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    if (currentUser) {
      AsyncStorage.getItem(`chat_${currentUser.id}`).then(res => {
        if (res) setChatMessages(JSON.parse(res));
      });
    }
  }, [currentUser]);

  const saveChat = async (newMsgs) => {
    setChatMessages(newMsgs);
    if (currentUser) await AsyncStorage.setItem(`chat_${currentUser.id}`, JSON.stringify(newMsgs));
  };

  const handleSend = async (customText) => {
    const textToSend = (customText || input).trim();
    if (!textToSend) return;

    const userMsg = { id: Date.now(), sender: 'user', text: textToSend };
    const updated = [...chatMessages, userMsg];
    saveChat(updated);
    setInput('');
    setIsTyping(true);

    try {
      const testsContext = tests && tests.length > 0 ? `\nHere are the current available tests: ${JSON.stringify(tests.map(t => ({ title: t.title, duration: t.duration, questions: t.questions?.map(q => ({ question: q.question_text, options: [q.option_a, q.option_b, q.option_c, q.option_d], correct_answer: q.correct_option })) })))}` : '';
      const systemInstruction = `You are a brilliant and friendly Student Assistant for ${currentUser?.fullName || 'a student'} in the ${currentUser?.department || 'General'} department. You excel at:\n- Crystal-clear explanations with real-world analogies\n- Step-by-step problem solving\n- Creating practice questions and quizzes\n- Providing test answers from the available tests context\nBe concise yet thorough. Use bullet points. Be encouraging and supportive.${testsContext}`;
      
      const contents = updated.slice(-20).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: { text: systemInstruction } },
          contents: contents,
          generationConfig: { temperature: 0.7 }
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        const errMsg = data.error?.message || JSON.stringify(data.error);
        saveChat([...updated, { id: Date.now() + 1, sender: 'ai', text: `API Error: ${errMsg}` }]);
      } else {
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
        saveChat([...updated, { id: Date.now() + 1, sender: 'ai', text: aiText }]);
      }
    } catch (error) {
      saveChat([...updated, { id: Date.now() + 1, sender: 'ai', text: "Network error. Please check your connection." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = [
    { text: '💡 Explain a concept', prompt: 'Can you explain a complex concept in simple terms?' },
    { text: '📝 Quiz me', prompt: 'Give me 5 multiple choice questions on my subject' },
    { text: '📋 Study plan', prompt: 'Create a study plan for my upcoming exams' },
    { text: '🧮 Solve a problem', prompt: 'Help me solve a problem step by step' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      {/* Dark header */}
      <LinearGradient colors={['#111827', '#1E293B']} style={{ paddingTop: 44, paddingBottom: 16, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LinearGradient colors={['#7C3AED', '#2563EB']} style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <BrainCircuit color="#FFF" size={22} />
            </LinearGradient>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFF' }}>Student Assistant</Text>
              <Text style={{ fontSize: 12, color: '#94A3B8' }}>{isTyping ? 'Thinking...' : 'Online • AI Tutor'}</Text>
            </View>
          </View>
          {chatMessages.length > 0 && (
            <TouchableOpacity onPress={() => Alert.alert('New Chat', 'Start a new conversation?', [{ text: 'Cancel' }, { text: 'Clear', style: 'destructive', onPress: () => saveChat([]) }])} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 10 }}>
              <Trash2 color="#94A3B8" size={18} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Messages */}
      <ScrollView
        style={{ flex: 1, backgroundColor: '#FAFAFA' }}
        contentContainerStyle={{ paddingVertical: 16, flexGrow: 1, justifyContent: chatMessages.length === 0 ? 'center' : 'flex-start' }}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {chatMessages.length === 0 ? (
          <View style={{ alignItems: 'center', paddingHorizontal: 32 }}>
            <LinearGradient colors={['#7C3AED', '#2563EB']} style={{ width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <BrainCircuit color="#FFF" size={36} />
            </LinearGradient>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 }}>How can I help you?</Text>
            <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 32, lineHeight: 20 }}>I'm your AI tutor. Ask me questions, request explanations, or get help with problems.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              {suggestions.map((s, i) => (
                <TouchableOpacity key={i} onPress={() => handleSend(s.prompt)} style={{ backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', width: '47%', marginBottom: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>{s.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          chatMessages.map(msg => <ChatMessage key={msg.id} msg={msg} currentUser={currentUser} />)
        )}
        {isTyping && (
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 }}>
            <LinearGradient colors={['#7C3AED', '#4F46E5']} style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 4 }}>
              <BrainCircuit color="#FFF" size={16} />
            </LinearGradient>
            <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 18, borderTopLeftRadius: 4 }}>
              <TypingDots />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={{ backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#FFFFFF', borderRadius: 28, paddingHorizontal: 18, paddingVertical: 6, borderWidth: 1.5, borderColor: input ? '#2563EB' : '#D1D5DB', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }}>
          <TextInput
            style={{ flex: 1, fontSize: 16, color: '#1F2937', minHeight: 44, maxHeight: 100, paddingVertical: 8 }}
            value={input}
            onChangeText={setInput}
            placeholder="Message Assistant..."
            placeholderTextColor="#9CA3AF"
            multiline
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity onPress={() => handleSend()} disabled={!input.trim()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: input.trim() ? '#2563EB' : '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginLeft: 8, marginBottom: 2 }}>
            <Send color="#FFF" size={18} />
          </TouchableOpacity>
        </View>
      </View>
      </KeyboardAvoidingView>
      {!keyboardVisible && <View style={{ height: Platform.OS === 'ios' ? 82 : 72 }} />}
    </View>
  );
}

export function ProfileTab({ onLogout, currentUser, updateCurrentUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || '',
    registerNumber: currentUser?.registerNumber || '',
    department: currentUser?.department || '',
    collegeName: currentUser?.collegeName || '',
    collegeCode: currentUser?.collegeCode || ''
  });

  const handleSave = async () => {
    if (!currentUser?.id) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, formData);
      if (updateCurrentUser) {
        updateCurrentUser(formData);
      }
      setIsEditing(false);
    } catch (e) {
      Alert.alert('Error', 'Could not update profile: ' + e.message);
    }
    setSaving(false);
  };

  return (
    <ScrollView style={styles.tabContainer} contentContainerStyle={styles.p6}>
      <View style={styles.profileHeaderCard}>
        <View style={[styles.profileImg, { backgroundColor: COLORS.blue500, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ color: '#FFF', fontSize: 32, fontWeight: '700' }}>{currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'S'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>{currentUser?.fullName || 'Student'}</Text>
          <Text style={styles.pageSubtitle}>Reg: {currentUser?.registerNumber || 'N/A'}</Text>
        </View>
        <TouchableOpacity style={{ padding: 8, backgroundColor: isEditing ? '#fee2e2' : '#f1f5f9', borderRadius: 8 }} onPress={() => setIsEditing(!isEditing)}>
          {isEditing ? <X color="#dc2626" size={20} /> : <Edit2 color={COLORS.blue600} size={20} />}
        </TouchableOpacity>
      </View>

      <View style={[styles.cardSecondary, { marginBottom: 16 }]}>
        <Text style={[styles.cardTitle, { marginBottom: 16 }]}>Academic Info</Text>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: COLORS.gray500, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>Full Name</Text>
          {isEditing ? (
            <TextInput style={styles.editInput} value={formData.fullName} onChangeText={(t) => setFormData(prev => ({...prev, fullName: t}))} />
          ) : (
             <Text style={{ fontSize: 16, color: COLORS.gray800, fontWeight: '600' }}>{currentUser?.fullName || 'Not specified'}</Text>
          )}
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: COLORS.gray500, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>Register Number</Text>
          {isEditing ? (
            <TextInput style={styles.editInput} value={formData.registerNumber} onChangeText={(t) => setFormData(prev => ({...prev, registerNumber: t}))} />
          ) : (
            <Text style={{ fontSize: 16, color: COLORS.gray800, fontWeight: '600' }}>{currentUser?.registerNumber || 'Not specified'}</Text>
          )}
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: COLORS.gray500, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>Department</Text>
          {isEditing ? (
            <TextInput style={styles.editInput} value={formData.department} onChangeText={(t) => setFormData(prev => ({...prev, department: t}))} />
          ) : (
            <Text style={{ fontSize: 16, color: COLORS.gray800, fontWeight: '600' }}>{currentUser?.department || 'Not specified'}</Text>
          )}
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: COLORS.gray500, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>College Name</Text>
          {isEditing ? (
            <TextInput style={styles.editInput} value={formData.collegeName} onChangeText={(t) => setFormData(prev => ({...prev, collegeName: t}))} />
          ) : (
            <Text style={{ fontSize: 16, color: COLORS.gray800, fontWeight: '600' }}>{currentUser?.collegeName || 'Not specified'}</Text>
          )}
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: COLORS.gray500, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>College Code</Text>
          {isEditing ? (
            <TextInput style={styles.editInput} value={formData.collegeCode} onChangeText={(t) => setFormData(prev => ({...prev, collegeCode: t}))} />
          ) : (
            <Text style={{ fontSize: 16, color: COLORS.gray800, fontWeight: '600' }}>{currentUser?.collegeCode || 'Not specified'}</Text>
          )}
        </View>

        <View style={{ marginBottom: isEditing ? 24 : 0 }}>
          <Text style={{ fontSize: 12, color: COLORS.gray500, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>Email (Non-editable)</Text>
          <Text style={{ fontSize: 16, color: COLORS.gray800, fontWeight: '600' }}>{currentUser?.email || 'Not specified'}</Text>
        </View>

        {isEditing && (
          <TouchableOpacity style={[styles.loginBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
             <Text style={styles.loginBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
         <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

export function StudentUploadNotesScreen({ navigation, currentUser }) {
  const [uploads, setUploads] = useState([]);

  useEffect(() => {
    if (currentUser) {
      AsyncStorage.getItem(`uploads_${currentUser.id}`).then(res => {
        if (res) setUploads(JSON.parse(res));
      });
    }
  }, [currentUser]);

  const saveFiles = async (newUploads) => {
    setUploads(newUploads);
    if (currentUser) {
      await AsyncStorage.setItem(`uploads_${currentUser.id}`, JSON.stringify(newUploads));
    }
  };

  const pickAndUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedFile = result.assets[0];
        
        const newFile = {
          id: Date.now().toString(),
          title: pickedFile.name,
          size: (pickedFile.size / (1024 * 1024)).toFixed(1) + ' MB',
          date: 'Just now',
          uri: pickedFile.uri,
          iconBg: COLORS.blue100,
          iconColor: COLORS.blue500
        };
        
        saveFiles([newFile, ...uploads]);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not pick document.');
    }
  };

  const deleteFile = (id) => {
    saveFiles(uploads.filter(u => u.id !== id));
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.gray900} size={24} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Upload Notes</Text>
      </View>
      <ScrollView style={{ flex: 1, padding: 24 }}>
        <TouchableOpacity style={styles.uploadArea} onPress={pickAndUploadDocument}>
          <UploadCloud color={COLORS.blue500} size={40} style={{ marginBottom: 12 }} />
          <Text style={styles.uploadAreaTitle}>Upload Personal Notes</Text>
          <Text style={styles.uploadAreaSub}>Tap to browse or drag file here</Text>
        </TouchableOpacity>

        <Text style={[styles.cardTitle, { marginBottom: 16 }]}>My Uploads</Text>
        {uploads.length === 0 ? (
          <Text style={{ color: COLORS.gray500, fontStyle: 'italic' }}>No uploads yet.</Text>
        ) : (
          uploads.map(file => (
            <View key={file.id} style={styles.uploadItem}>
               <View style={[styles.uploadIconWrap, { backgroundColor: file.iconBg }]}>
                 <FileText color={file.iconColor} size={24} />
               </View>
               <View style={{ flex: 1 }}>
                 <Text style={styles.uploadItemTitle}>{file.title}</Text>
                 <Text style={styles.uploadItemSub}>{file.size} • {file.date}</Text>
               </View>
                <TouchableOpacity onPress={() => deleteFile(file.id)} style={{ padding: 8 }}>
                 <Trash2 color={COLORS.gray400} size={20} />
               </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

export function StudentUploadAssignmentScreen({ navigation, route, currentUser }) {
  const teacherId = route.params?.teacherId || 'unknown';
  const teacherName = route.params?.teacherName || 'Teacher';
  const [uploads, setUploads] = useState([]);

  useEffect(() => {
    if (currentUser) {
      AsyncStorage.getItem(`assignments_${currentUser.id}_${teacherId}`).then(res => {
        if (res) setUploads(JSON.parse(res));
      });
    }
  }, [currentUser, teacherId]);

  const saveFiles = async (newUploads) => {
    setUploads(newUploads);
    if (currentUser) {
      await AsyncStorage.setItem(`assignments_${currentUser.id}_${teacherId}`, JSON.stringify(newUploads));
    }
  };

  const pickAndUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedFile = result.assets[0];
        
        const newFile = {
          id: Date.now().toString(),
          title: pickedFile.name,
          size: (pickedFile.size / (1024 * 1024)).toFixed(1) + ' MB',
          date: 'Just now',
          uri: pickedFile.uri,
          iconBg: COLORS.blue100,
          iconColor: COLORS.blue500
        };
        
        saveFiles([newFile, ...uploads]);
        Alert.alert('Success', `Assignment sent seamlessly to ${teacherName}.`);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not pick document.');
    }
  };

  const deleteFile = (id) => {
    saveFiles(uploads.filter(u => u.id !== id));
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.gray900} size={24} />
        </TouchableOpacity>
        <View>
          <Text style={styles.pageTitle}>Submit Assignment</Text>
          <Text style={{ fontSize: 13, color: COLORS.gray500, fontWeight: '500' }}>To: {teacherName}</Text>
        </View>
      </View>
      <ScrollView style={{ flex: 1, padding: 24 }}>
        <TouchableOpacity style={styles.uploadArea} onPress={pickAndUploadDocument}>
          <UploadCloud color={COLORS.blue500} size={40} style={{ marginBottom: 12 }} />
          <Text style={styles.uploadAreaTitle}>Upload Assignment Document</Text>
          <Text style={styles.uploadAreaSub}>Tap to browse or drag file here</Text>
        </TouchableOpacity>

        <Text style={[styles.cardTitle, { marginBottom: 16 }]}>My Submissions</Text>
        {uploads.length === 0 ? (
          <Text style={{ color: COLORS.gray500, fontStyle: 'italic' }}>No submissions yet.</Text>
        ) : (
          uploads.map(file => (
            <View key={file.id} style={styles.uploadItem}>
               <View style={[styles.uploadIconWrap, { backgroundColor: file.iconBg }]}>
                 <FileText color={file.iconColor} size={24} />
               </View>
               <View style={{ flex: 1 }}>
                 <Text style={styles.uploadItemTitle}>{file.title}</Text>
                 <Text style={styles.uploadItemSub}>{file.size} • Submitted {file.date}</Text>
               </View>
               <TouchableOpacity onPress={() => deleteFile(file.id)} style={{ padding: 8 }}>
                 <Trash2 color={COLORS.gray400} size={20} />
               </TouchableOpacity>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

export function StudentWatchVideosScreen({ navigation }) {
  const videos = [];

  return (
    <View style={[styles.screenContainer, { backgroundColor: COLORS.gray50 }]}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.gray900} size={24} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Watch Videos</Text>
      </View>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {videos.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: COLORS.gray500, fontStyle: 'italic' }}>No videos available.</Text>
          </View>
        ) : (
          videos.map(v => (
            <TouchableOpacity key={v.id} style={styles.videoCard}>
              <LinearGradient colors={v.colors} style={styles.videoThumb}>
                <View style={styles.videoPlayBtn}>
                  <PlayCircle color={COLORS.blue500} size={28} />
                </View>
                <View style={styles.videoDurationWrap}>
                  <Text style={styles.videoDurationText}>{v.duration}</Text>
                </View>
              </LinearGradient>
              <View style={{ padding: 16 }}>
                <Text style={styles.videoTitle}>{v.title}</Text>
                <Text style={styles.videoSubTitle}>AI Prep Channel • 1.2k views</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// Student Styles
const styles = StyleSheet.create({
  tabContainer: { flex: 1, backgroundColor: COLORS.transparent, paddingTop: Platform.OS === 'android' ? 40 : 50 },
  screenContainer: { flex: 1, backgroundColor: '#FFF', paddingTop: Platform.OS === 'android' ? 30 : 40 },
  p6: { padding: 24, paddingVertical: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  aiPrepLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  aiPrepText: { color: COLORS.blue600, fontWeight: '500' },
  greeting: { fontSize: 28, fontWeight: '700', color: COLORS.gray900 },
  profilePicWrapper: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: '#FFF', elevation: 2 },
  profilePic: { width: '100%', height: '100%' },
  cardMain: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, marginBottom: 24, elevation: 3, overflow: 'hidden' },
  blurCircle: { position: 'absolute', right: -24, top: -24, width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.cyan500, opacity: 0.1 },
  examTitle: { fontSize: 18, fontWeight: '600', color: COLORS.gray800 },
  examDaysRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 16, marginBottom: 24 },
  examDaysNum: { fontSize: 56, fontWeight: '700', color: COLORS.gray900, lineHeight: 60 },
  examDaysLabel: { fontSize: 18, color: COLORS.gray500, fontWeight: '500', marginBottom: 8, marginLeft: 8 },
  progressContainer: {},
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 14, color: COLORS.gray500, fontWeight: '500' },
  progressBarBg: { height: 8, backgroundColor: COLORS.gray100, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  cardSecondary: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, elevation: 3 },
  cardHeaderFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray900 },
  addBtnContainer: { padding: 4, backgroundColor: COLORS.blue50, borderRadius: 16 },
  tasksList: { marginBottom: 24 },
  emptyText: { color: COLORS.gray400, fontStyle: 'italic', fontSize: 14 },
  taskItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  taskCheckbox: { marginRight: 12 },
  taskTitle: { flex: 1, fontSize: 16, color: COLORS.gray700, fontWeight: '500' },
  taskTitleDone: { color: COLORS.gray400, textDecorationLine: 'line-through' },
  taskActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray900, marginBottom: 16, marginLeft: 4 },
  quickActionGroup: { alignItems: 'center', width: '23%', marginBottom: 16 },
  quickActionBtn: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  quickActionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray600, textAlign: 'center', marginTop: 8 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: COLORS.gray900, marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: COLORS.gray500, marginBottom: 24 },
  addBtnPill: { backgroundColor: COLORS.blue50, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  addBtnPillText: { color: COLORS.blue500, fontWeight: '500', fontSize: 14 },
  taskCardBox: { backgroundColor: '#FFF', padding: 16, borderRadius: 20, elevation: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderWidth: 1, borderColor: COLORS.gray200 },
  inlineCardBox: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, borderWidth: 1, borderColor: COLORS.gray200 },
  taskCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  taskCardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.gray800 },
  taskCardStatusText: { fontSize: 12, color: COLORS.gray500 },
  testHeader: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  timerPill: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, borderWidth: 1, borderColor: COLORS.gray100, elevation: 1 },
  timerText: { fontSize: 14, fontWeight: '700', color: COLORS.gray900 },
  questionCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, elevation: 1, borderWidth: 1, borderColor: COLORS.gray50, minHeight: 300 },
  questionText: { fontSize: 20, fontWeight: '600', color: COLORS.gray800 },
  answerOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: COLORS.gray100, backgroundColor: '#FFF', marginBottom: 12 },
  answerOptionActive: { borderColor: COLORS.blue500, backgroundColor: COLORS.blue50 },
  answerOptionLetter: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  answerOptionLetterActive: { backgroundColor: COLORS.blue500 },
  answerOptionLetterText: { fontSize: 14, fontWeight: '700', color: COLORS.gray800 },
  answerOptionLetterTextActive: { color: '#FFF' },
  answerOptionText: { flex: 1, fontSize: 16, fontWeight: '500', color: COLORS.gray800 },
  answerOptionTextActive: { color: COLORS.blue700 },
  testFooter: { padding: 24, flexDirection: 'row', justifyContent: 'space-between' },
  testNavBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  testNavBtnPrev: { backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.gray100, elevation: 1 },
  testNavBtnNext: { backgroundColor: COLORS.blue500, elevation: 2 },
  testNavBtnDisabled: { backgroundColor: COLORS.gray200 },
  testNavBtnText: { fontSize: 16, fontWeight: '700' },
  testNavBtnPrevText: { color: COLORS.blue500 },
  testNavBtnNextText: { color: '#FFF' },
  testNavBtnTextDisabled: { color: COLORS.gray400 },
  testFinishedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  testFinishedIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  testFinishedTitle: { fontSize: 24, fontWeight: '700', color: COLORS.gray900, marginBottom: 16 },
  retakeBtn: { paddingHorizontal: 32, paddingVertical: 12, backgroundColor: COLORS.blue500, borderRadius: 12, elevation: 2 },
  retakeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  aiAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 1, marginRight: 12 },
  aiAvatarText: { color: COLORS.blue500, fontWeight: '700' },
  msgRow: { flexDirection: 'row', marginBottom: 16 },
  msgUser: { justifyContent: 'flex-end' },
  msgAi: { justifyContent: 'flex-start' },
  msgBubble: { maxWidth: '80%', padding: 16, borderRadius: 16 },
  msgBubbleUser: { backgroundColor: COLORS.blue500, borderBottomRightRadius: 4 },
  msgBubbleAi: { backgroundColor: '#FFF', borderBottomLeftRadius: 4, elevation: 1 },
  msgText: { fontSize: 14 },
  msgTextUser: { color: '#FFF' },
  msgTextAi: { color: COLORS.gray800 },
  chatFooter: { padding: 16, backgroundColor: COLORS.gray50, borderTopWidth: 1, borderColor: COLORS.gray200 },
  chatInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 8, borderRadius: 24, borderWidth: 1, borderColor: COLORS.gray200 },
  chatInput: { flex: 1, paddingHorizontal: 16, fontSize: 14, color: COLORS.gray700, maxHeight: 100 },
  chatSendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.blue500, alignItems: 'center', justifyContent: 'center' },
  profileHeaderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 24, elevation: 1, marginBottom: 32 },
  profileImg: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: COLORS.cyan400, marginRight: 16 },
  scoreText: { fontSize: 32, fontWeight: '700', color: COLORS.gray900 },
  logoutBtn: { width: '100%', marginTop: 32, paddingVertical: 16, backgroundColor: COLORS.red50, borderRadius: 16, borderWidth: 1, borderColor: COLORS.red100, alignItems: 'center' },
  logoutBtnText: { color: COLORS.red500, fontWeight: '700', fontSize: 16 },
  editInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, color: '#1E293B', flex: 1 },
  loginBtn: { backgroundColor: COLORS.blue600, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  screenHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 40, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: COLORS.gray100 },
  backBtn: { marginRight: 16, padding: 8, borderRadius: 20 },
  uploadArea: { borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.blue400, borderRadius: 24, padding: 32, alignItems: 'center', backgroundColor: '#EFF6FF', marginBottom: 32 },
  uploadAreaTitle: { fontSize: 16, fontWeight: '600', color: COLORS.gray900, marginBottom: 4 },
  uploadAreaSub: { fontSize: 12, color: COLORS.gray500 },
  uploadItem: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, elevation: 1, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: COLORS.gray100 },
  uploadIconWrap: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  uploadItemTitle: { fontSize: 14, fontWeight: '600', color: COLORS.gray800 },
  uploadItemSub: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  videoCard: { backgroundColor: '#FFF', borderRadius: 24, elevation: 1, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.gray100 },
  videoThumb: { height: 160, width: '100%', alignItems: 'center', justifyContent: 'center' },
  videoPlayBtn: { width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  videoDurationWrap: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  videoDurationText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  videoTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray900 },
  videoSubTitle: { fontSize: 12, fontWeight: '500', color: COLORS.gray500, marginTop: 6 },
});
