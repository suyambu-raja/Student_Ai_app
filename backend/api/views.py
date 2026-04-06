from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.decorators import api_view, parser_classes as parser_classes_decorator
from django.conf import settings
from .models import Material, Test, Question, TestSubmission, AssignmentSubmission
from .serializers import MaterialSerializer, TestSerializer, TestCreateSerializer, TestSubmissionSerializer, AssignmentSubmissionSerializer
import json
import urllib.request
import urllib.error


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


@api_view(['POST'])
def gemini_chat(request):
    """
    Proxy endpoint for Gemini AI chat.
    The API key stays server-side — frontend never sees it.
    """
    api_key = settings.GEMINI_API_KEY

    if not api_key:
        return Response(
            {"error": "Gemini API key not configured on server. Set GEMINI_API_KEY environment variable."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    body = request.data
    payload = {
        "contents": body.get("contents", []),
        "generationConfig": body.get("generationConfig", {"temperature": 0.7}),
    }

    system_instruction = body.get("systemInstruction")
    if system_instruction:
        payload["systemInstruction"] = {"parts": {"text": system_instruction}}

    payload_bytes = json.dumps(payload).encode('utf-8')

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=payload_bytes,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            resp_data = json.loads(resp.read().decode('utf-8'))

        ai_text = ""
        try:
            ai_text = resp_data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            ai_text = "Sorry, I couldn't generate a response."

        return Response({"text": ai_text})

    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else str(e)
        try:
            error_json = json.loads(error_body)
            error_msg = error_json.get("error", {}).get("message", error_body)
        except (json.JSONDecodeError, AttributeError):
            error_msg = error_body
        return Response(
            {"error": f"Gemini API error: {error_msg}"},
            status=e.code
        )
    except Exception as e:
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

