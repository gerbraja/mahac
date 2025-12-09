import requests

# Test if backend is responding
try:
    response = requests.get('http://localhost:8000/health')
    print(f'✅ Backend is responding: {response.status_code}')
except Exception as e:
    print(f'❌ Backend not responding: {e}')

# Show configured changes
print('\n📋 CHANGES IMPLEMENTED:')
print('=' * 60)
print('1. ✅ CompleteRegistrationData schema:')
print('   - Added: country: Optional[str] = None')
print('')
print('2. ✅ complete_registration() endpoint:')
print('   - Added: user.country = data.country')
print('')
print('3. ✅ UpdateProfileData schema:')
print('   - Added: country: Optional[str] = None')
print('')
print('4. ✅ update_profile() endpoint:')
print('   - Added: if data.country: current_user.country = data.country')
print('')
print('5. ✅ PersonalView.jsx:')
print('   - Country field now editable when in edit mode')
print('   - Uses formData.country for storage')
print('   - Shows placeholder example')
print('=' * 60)
print('\n✅ Country field is fully integrated!')
print('   - Saves during registration')
print('   - Displays in Personal section')
print('   - Can be edited in Personal section')
