from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from .models import Material, Test, Question, TestSubmission, AssignmentSubmission
from .serializers import MaterialSerializer, TestSerializer, TestCreateSerializer, TestSubmissionSerializer, AssignmentSubmissionSerializer

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = self.queryset
        college_code = self.request.query_params.get('collegeCode')
        department = self.request.query_params.get('department')
        if college_code:
            queryset = queryset.filter(collegeCode=college_code)
        if department:
            queryset = queryset.filter(department=department)
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class TestViewSet(viewsets.ModelViewSet):
    queryset = Test.objects.all()
    serializer_class = TestSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return TestCreateSerializer
        return TestSerializer

    def get_queryset(self):
        queryset = self.queryset.prefetch_related('questions', 'submissions')
        college_code = self.request.query_params.get('collegeCode')
        department = self.request.query_params.get('department')
        if college_code:
            queryset = queryset.filter(collegeCode=college_code)
        if department:
            queryset = queryset.filter(department=department)
        return queryset

class TestSubmissionViewSet(viewsets.ModelViewSet):
    queryset = TestSubmission.objects.all()
    serializer_class = TestSubmissionSerializer

    def get_queryset(self):
        queryset = self.queryset
        student_id = self.request.query_params.get('studentId')
        test_id = self.request.query_params.get('testId')
        college_code = self.request.query_params.get('collegeCode')
        department = self.request.query_params.get('department')
        if student_id:
            queryset = queryset.filter(studentId=student_id)
        if test_id:
            queryset = queryset.filter(test_id=test_id)
        if college_code:
            queryset = queryset.filter(collegeCode=college_code)
        if department:
            queryset = queryset.filter(department=department)
        return queryset.order_by('-submitted_at')

class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AssignmentSubmission.objects.all()
    serializer_class = AssignmentSubmissionSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = self.queryset
        teacher_id = self.request.query_params.get('teacherId')
        student_id = self.request.query_params.get('studentId')
        if teacher_id:
            queryset = queryset.filter(teacherId=teacher_id)
        if student_id:
            queryset = queryset.filter(studentId=student_id)
        return queryset.order_by('-submitted_at')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
