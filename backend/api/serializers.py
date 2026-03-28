from rest_framework import serializers
from .models import Material, Test, Question, TestSubmission

class MaterialSerializer(serializers.ModelSerializer):
    file_download_url = serializers.SerializerMethodField()

    class Meta:
        model = Material
        fields = '__all__'

    def get_file_download_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.fileUrl or ''

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer']

class TestSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    submissions_count = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = '__all__'

    def get_submissions_count(self, obj):
        return obj.submissions.count()

class TestCreateSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, required=False)

    class Meta:
        model = Test
        fields = '__all__'

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        test = Test.objects.create(**validated_data)
        for q_data in questions_data:
            Question.objects.create(test=test, **q_data)
        test.questions_count = len(questions_data)
        test.save()
        return test

class TestSubmissionSerializer(serializers.ModelSerializer):
    test_title = serializers.CharField(source='test.title', read_only=True)

    class Meta:
        model = TestSubmission
        fields = '__all__'
