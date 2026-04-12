import type { Config } from '@measured/puck';

export type PuckProps = {
    HeroBlock: {
        title: string;
        subtitle: string;
        bgColor: string;
    };
    NewsGridBlock: {
        heading: string;
        maxItems: number;
    };
    AboutSnippetBlock: {
        heading: string;
        body: string;
    };
    GalleryBlock: {
        heading: string;
    };
    ContactBlock: {
        heading: string;
        showMap: boolean;
    };
    DividerBlock: Record<string, never>;
};

export const puckConfig: Config<PuckProps> = {
    components: {
        HeroBlock: {
            label: 'Hero Section',
            fields: {
                title: { type: 'text', label: 'หัวข้อ' },
                subtitle: { type: 'text', label: 'คำบรรยาย' },
                bgColor: { type: 'text', label: 'สีพื้นหลัง (hex)' },
            },
            defaultProps: {
                title: 'ยินดีต้อนรับ',
                subtitle: 'เว็บไซต์โรงเรียน',
                bgColor: '#1a56db',
            },
            render: ({ title, subtitle, bgColor }) => (
                <div style={{ backgroundColor: bgColor }} className="py-16 text-center text-white rounded-lg">
                    <h1 className="text-4xl font-bold mb-3">{title}</h1>
                    <p className="text-xl opacity-80">{subtitle}</p>
                </div>
            ),
        },

        NewsGridBlock: {
            label: 'กริดข่าวสาร',
            fields: {
                heading: { type: 'text', label: 'หัวข้อ' },
                maxItems: { type: 'number', label: 'จำนวนข่าว' },
            },
            defaultProps: { heading: 'ข่าวสาร & ประกาศ', maxItems: 6 },
            render: ({ heading, maxItems }) => (
                <div className="py-8 bg-secondary/30 rounded-lg px-6">
                    <h2 className="text-2xl font-bold mb-4">{heading}</h2>
                    <p className="text-muted-foreground">แสดงข่าวล่าสุด {maxItems} รายการ</p>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        {Array.from({ length: Math.min(maxItems, 3) }).map((_, i) => (
                            <div key={i} className="h-24 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                                ข่าว {i + 1}
                            </div>
                        ))}
                    </div>
                </div>
            ),
        },

        AboutSnippetBlock: {
            label: 'เกี่ยวกับโรงเรียน',
            fields: {
                heading: { type: 'text', label: 'หัวข้อ' },
                body: { type: 'textarea', label: 'เนื้อหา' },
            },
            defaultProps: {
                heading: 'เกี่ยวกับเรา',
                body: 'โรงเรียนของเรามุ่งมั่นพัฒนาผู้เรียน...',
            },
            render: ({ heading, body }) => (
                <div className="py-8 px-6 bg-card border rounded-lg">
                    <h2 className="text-2xl font-bold mb-3">{heading}</h2>
                    <p className="text-muted-foreground leading-relaxed">{body}</p>
                </div>
            ),
        },

        GalleryBlock: {
            label: 'แกลเลอรี่',
            fields: {
                heading: { type: 'text', label: 'หัวข้อ' },
            },
            defaultProps: { heading: 'ภาพกิจกรรม' },
            render: ({ heading }) => (
                <div className="py-8 px-6 bg-secondary/20 rounded-lg">
                    <h2 className="text-2xl font-bold mb-4">{heading}</h2>
                    <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="aspect-square bg-muted rounded-md" />
                        ))}
                    </div>
                </div>
            ),
        },

        ContactBlock: {
            label: 'ติดต่อเรา',
            fields: {
                heading: { type: 'text', label: 'หัวข้อ' },
                showMap: { type: 'radio', label: 'แสดงแผนที่', options: [{ label: 'ใช่', value: true }, { label: 'ไม่', value: false }] },
            },
            defaultProps: { heading: 'ติดต่อเรา', showMap: true },
            render: ({ heading, showMap }) => (
                <div className="py-8 px-6 bg-card border rounded-lg">
                    <h2 className="text-2xl font-bold mb-3">{heading}</h2>
                    <p className="text-muted-foreground">ข้อมูลการติดต่อโรงเรียน</p>
                    {showMap && <div className="mt-4 h-32 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">แผนที่</div>}
                </div>
            ),
        },

        DividerBlock: {
            label: 'เส้นคั่น',
            fields: {},
            defaultProps: {},
            render: () => <hr className="my-4 border-border" />,
        },
    },
};
