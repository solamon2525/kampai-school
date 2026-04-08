import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Phone, GraduationCap, Award, Users } from 'lucide-react';

const teachingStaff = [
  {
    name: 'นายสมชาย ใจดี',
    position: 'หัวหน้ากลุ่มสาระการเรียนรู้ภาษาไทย',
    subject: 'ภาษาไทย',
    education: 'ปริญญาโท ภาษาไทย',
    experience: '15 ปี',
    color: 'from-blue-500 to-blue-400',
  },
  {
    name: 'นางสาวสุภา รักเรียน',
    position: 'หัวหน้ากลุ่มสาระการเรียนรู้คณิตศาสตร์',
    subject: 'คณิตศาสตร์',
    education: 'ปริญญาโท คณิตศาสตร์ศึกษา',
    experience: '12 ปี',
    color: 'from-green-500 to-green-400',
  },
  {
    name: 'นายวิทยา ฉลาดคิด',
    position: 'หัวหน้ากลุ่มสาระการเรียนรู้วิทยาศาสตร์',
    subject: 'วิทยาศาสตร์',
    education: 'ปริญญาโท วิทยาศาสตร์ศึกษา',
    experience: '10 ปี',
    color: 'from-purple-500 to-purple-400',
  },
  {
    name: 'นางภาวินี สุขสม',
    position: 'หัวหน้ากลุ่มสาระการเรียนรู้ภาษาต่างประเทศ',
    subject: 'ภาษาอังกฤษ',
    education: 'ปริญญาโท ภาษาอังกฤษ',
    experience: '14 ปี',
    color: 'from-red-500 to-red-400',
  },
  {
    name: 'นายประเสริฐ ศิลปิน',
    position: 'หัวหน้ากลุ่มสาระการเรียนรู้ศิลปะ',
    subject: 'ศิลปะ',
    education: 'ปริญญาตรี ศิลปศึกษา',
    experience: '8 ปี',
    color: 'from-orange-500 to-orange-400',
  },
  {
    name: 'นางสาวกาญจนา แข็งแรง',
    position: 'หัวหน้ากลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา',
    subject: 'สุขศึกษาและพลศึกษา',
    education: 'ปริญญาตรี พลศึกษา',
    experience: '7 ปี',
    color: 'from-teal-500 to-teal-400',
  },
  {
    name: 'นายอุดม ช่างคิด',
    position: 'หัวหน้ากลุ่มสาระการเรียนรู้การงานอาชีพ',
    subject: 'การงานอาชีพ',
    education: 'ปริญญาโท เทคโนโลยีการศึกษา',
    experience: '11 ปี',
    color: 'from-indigo-500 to-indigo-400',
  },
  {
    name: 'นางสาวสังคม สันติสุข',
    position: 'หัวหน้ากลุ่มสาระการเรียนรู้สังคมศึกษา',
    subject: 'สังคมศึกษา',
    education: 'ปริญญาโท สังคมศาสตร์',
    experience: '13 ปี',
    color: 'from-amber-500 to-amber-400',
  },
];

const supportStaff = [
  {
    name: 'นางสาวปราณี รักงาน',
    position: 'หัวหน้างานธุรการ',
    department: 'ฝ่ายบริหารทั่วไป',
    experience: '10 ปี',
  },
  {
    name: 'นายสมศักดิ์ รักษ์ความสะอาด',
    position: 'หัวหน้างานอาคารสถานที่',
    department: 'ฝ่ายบริหารทั่วไป',
    experience: '8 ปี',
  },
  {
    name: 'นางวันดี ใจดี',
    position: 'หัวหน้างานการเงินและพัสดุ',
    department: 'ฝ่ายบริหาร',
    experience: '12 ปี',
  },
  {
    name: 'นายคอมพิวเตอร์ เก่งมาก',
    position: 'หัวหน้างานเทคโนโลยีสารสนเทศ',
    department: 'ฝ่ายวิชาการ',
    experience: '6 ปี',
  },
];

const Staff = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-block text-accent font-semibold mb-4">บุคลากร</span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
                ข้าราชการครูและบุคลากรทางการศึกษา
              </h1>
              <p className="text-primary-foreground/80 text-lg">
                ทีมครูและบุคลากรที่มีความเชี่ยวชาญและทุ่มเทในการพัฒนานักเรียน
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-card rounded-2xl p-6 text-center shadow-md border border-border">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">45</div>
                <div className="text-muted-foreground">ครูผู้สอน</div>
              </div>
              <div className="bg-card rounded-2xl p-6 text-center shadow-md border border-border">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div className="text-3xl font-bold text-accent mb-2">15</div>
                <div className="text-muted-foreground">บุคลากรสนับสนุน</div>
              </div>
              <div className="bg-card rounded-2xl p-6 text-center shadow-md border border-border">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-green-500 mb-2">30</div>
                <div className="text-muted-foreground">ปริญญาโทขึ้นไป</div>
              </div>
              <div className="bg-card rounded-2xl p-6 text-center shadow-md border border-border">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-6 h-6 text-purple-500" />
                </div>
                <div className="text-3xl font-bold text-purple-500 mb-2">10+</div>
                <div className="text-muted-foreground">ปีประสบการณ์เฉลี่ย</div>
              </div>
            </div>
          </div>
        </section>

        {/* Teaching Staff */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="inline-block text-accent font-semibold mb-4">ครูผู้สอน</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                หัวหน้ากลุ่มสาระการเรียนรู้
              </h2>
              <p className="text-muted-foreground">
                ครูผู้เชี่ยวชาญในแต่ละสาขาวิชา พร้อมถ่ายทอดความรู้อย่างมีคุณภาพ
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teachingStaff.map((teacher, index) => (
                <div
                  key={index}
                  className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border"
                >
                  <div className={`h-32 bg-gradient-to-br ${teacher.color} relative flex items-center justify-center`}>
                    <div className="w-20 h-20 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center border-4 border-card/50">
                      <span className="text-3xl font-bold text-card">
                        {teacher.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 text-center">
                    <h3 className="text-lg font-bold text-foreground mb-1">{teacher.name}</h3>
                    <p className="text-accent font-medium text-sm mb-2">{teacher.position}</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>วิชา: {teacher.subject}</p>
                      <p>{teacher.education}</p>
                      <p>ประสบการณ์: {teacher.experience}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Support Staff */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="inline-block text-accent font-semibold mb-4">บุคลากรสนับสนุน</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                บุคลากรทางการศึกษา
              </h2>
              <p className="text-muted-foreground">
                ทีมงานสนับสนุนที่ช่วยให้การดำเนินงานของโรงเรียนเป็นไปอย่างราบรื่น
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {supportStaff.map((staff, index) => (
                <div
                  key={index}
                  className="bg-card rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-border text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">
                      {staff.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{staff.name}</h3>
                  <p className="text-accent font-medium text-sm mb-2">{staff.position}</p>
                  <p className="text-sm text-muted-foreground mb-1">{staff.department}</p>
                  <p className="text-sm text-muted-foreground">ประสบการณ์: {staff.experience}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="bg-primary rounded-3xl p-8 md:p-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-primary-foreground mb-2">ติดต่อฝ่ายบุคลากร</h3>
                  <p className="text-primary-foreground/80">สอบถามข้อมูลเพิ่มเติมเกี่ยวกับบุคลากร</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="tel:+66-2-XXX-XXXX"
                    className="inline-flex items-center gap-3 bg-accent text-accent-foreground px-6 py-3 rounded-xl font-semibold hover:bg-accent/90 transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    02-XXX-XXXX
                  </a>
                  <a
                    href="mailto:hr@bankamphai.ac.th"
                    className="inline-flex items-center gap-3 bg-primary-foreground/10 text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary-foreground/20 transition-colors border border-primary-foreground/20"
                  >
                    <Mail className="w-5 h-5" />
                    อีเมล
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Staff;
