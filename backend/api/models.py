from django.db import models

class Material(models.Model):
    teacherId = models.CharField(max_length=255)
    collegeName = models.CharField(max_length=255)
    collegeCode = models.CharField(max_length=50)
    department = models.CharField(max_length=255, blank=True, null=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    file_type = models.CharField(max_length=50, default='PDF')
    size = models.CharField(max_length=50, default='0 MB')
    file = models.FileField(upload_to='materials/', blank=True, null=True)
    fileUrl = models.URLField(max_length=1000, blank=True, null=True)
    date_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Test(models.Model):
    teacherId = models.CharField(max_length=255)
    collegeName = models.CharField(max_length=255)
    collegeCode = models.CharField(max_length=50)
    department = models.CharField(max_length=255, blank=True, null=True)
    title = models.CharField(max_length=255)
    duration = models.CharField(max_length=50)
    status = models.CharField(max_length=50, default='Active')
    questions_count = models.IntegerField(default=0)
    date_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Question(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    option_a = models.CharField(max_length=500)
    option_b = models.CharField(max_length=500)
    option_c = models.CharField(max_length=500)
    option_d = models.CharField(max_length=500)
    correct_answer = models.CharField(max_length=1)  # A, B, C, or D

    def __str__(self):
        return f"Q: {self.question_text[:50]}"

class TestSubmission(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='submissions')
    studentId = models.CharField(max_length=255)
    studentName = models.CharField(max_length=255, blank=True, default='')
    collegeCode = models.CharField(max_length=50, blank=True, default='')
    department = models.CharField(max_length=255, blank=True, default='')
    score = models.IntegerField(default=0)
    total = models.IntegerField(default=0)
    answers = models.JSONField(default=dict, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.studentName} - {self.test.title} ({self.score}/{self.total})"

class AssignmentSubmission(models.Model):
    studentId = models.CharField(max_length=255)
    studentName = models.CharField(max_length=255)
    teacherId = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    size = models.CharField(max_length=50, default='0 MB')
    file = models.FileField(upload_to='assignments/')
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.studentName} - {self.title}"
