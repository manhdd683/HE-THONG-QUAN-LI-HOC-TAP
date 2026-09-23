async function test() {
  try {
    // First login as tutor
    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'tutor@example.com',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    if (!token) throw new Error("No token");
    console.log('Logged in, token:', token.substring(0, 15) + '...');

    // Then create student
    console.log('Creating student...');
    const res = await fetch('http://localhost:5000/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: "Tran Quynh Chi",
        parentMode: "create",
        parent_name: "Nguyen An",
        parent_email: `test_${Date.now()}@gmail.com`,
        parent_phone: "0987654321",
        parent_password: "password123",
        gender: "Nam",
        school: "",
        grade: "Lớp 7",
        start_date: "2026-09-22",
        student_subjects: [
          { subject: "Toán", price_per_session: 120000 },
          { subject: "Tiếng anh", price_per_session: 200000 }
        ]
      })
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('API Error:', res.status, data);
    } else {
      console.log('Success:', data.id);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

test();
