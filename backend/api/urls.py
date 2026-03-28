from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaterialViewSet, TestViewSet, TestSubmissionViewSet, AssignmentSubmissionViewSet

router = DefaultRouter()
router.register(r'materials', MaterialViewSet)
router.register(r'tests', TestViewSet)
router.register(r'submissions', TestSubmissionViewSet)
router.register(r'assignments', AssignmentSubmissionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
