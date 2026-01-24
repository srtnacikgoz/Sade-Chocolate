# Claude Code Skill Rehberi

> **Amaç:** Skill'lerin ne zaman kullanılacağını hızlıca bulmak için evrensel referans.
>
> **Son Güncelleme:** 15 Ocak 2026
> **Toplam Skill:** 15

---

## Kullanım Prensibi

```
Görev karmaşıklığı YÜKSEK + Risk YÜKSEK → Skill kullan
Görev basit + Risk düşük → Direkt yap
```

**Tetikleyiciler:**
- 3+ dosya etkilenecek
- Geri dönüşü zor değişiklik
- 3rd party API/entegrasyon
- Gereksinimler belirsiz
- Production'da çalışan sistem

---

## Skill Kataloğu

### 1. Superpowers: Planlama & Tasarım

#### 1.1 brainstorming
| Alan | Açıklama |
|------|----------|
| **Ne Yapar** | Gereksinim analizi, alternatif çözümler, kullanıcı niyetini netleştirme |
| **Ne Zaman** | Yeni özellik başlamadan ÖNCE, "X ekle" gibi belirsiz taleplerde |
| **Invoke** | `superpowers:brainstorming` |

#### 1.2 writing-plans
| Alan | Açıklama |
|------|----------|
| **Ne Yapar** | Adım adım implementasyon planı oluşturma |
| **Ne Zaman** | Çok adımlı görevlerde, birden fazla component etkilendiğinde |
| **Invoke** | `superpowers:writing-plans` |

#### 1.3 executing-plans
| Alan | Açıklama |
|------|----------|
| **Ne Yapar** | Yazılmış planı ayrı session'da uygulama, review checkpoint'leri |
| **Ne Zaman** | Büyük planları parçalı çalışmak için |
| **Invoke** | `superpowers:executing-plans` |

---

### 2. Superpowers: Geliştirme & Kalite

#### 2.1 test-driven-development
| Alan | Açıklama |
|------|----------|
| **Ne Yapar** | Önce test yaz, sonra implementasyon |
| **Ne Zaman** | Test altyapısı olan projelerde, kritik business logic |
| **Invoke** | `superpowers:test-driven-development` |
| **Tip** | Rigid (harfiyen uygula) |

#### 2.2 systematic-debugging
| Alan | Açıklama |
|------|----------|
| **Ne Yapar** | Metodolojik hata ayıklama, root cause analizi |
| **Ne Zaman** | Bug, test failure, beklenmeyen davranış - FIX ÖNERMEDEN ÖNCE |
| **Invoke** | `superpowers:systematic-debugging` |
| **Tip** | Rigid (harfiyen uygula) |

#### 2.3 verification-before-completion
| Alan | Açıklama |
|------|----------|
| **Ne Yapar** | Tamamlandı demeden önce doğrulama komutları çalıştırma |
| **Ne Zaman** | Commit/PR/deploy öncesi, "düzelttim" demeden önce |
| **Invoke** | `superpowers:verification-before-completion` |

---

### 3. Superpowers: Kod İnceleme

#### 3.1 requesting-code-review
| Alan | Açıklama |
|------|----------|
| **Ne Yapar** | Yapılan işin incelenmesini isteme, gereksinimlere uygunluk kontrolü |
| **Ne Zaman** | Görev tamamlandığında, merge öncesi |
| **Invoke** | `superpowers:requesting-code-review` |

#### 3.2 receiving-code-review
| Alan | Açıklama |
|------|----------|
| **Ne Yapar** | Gelen review feedback'ini değerlendirme, teknik doğrulama |
| **Ne Zaman** | Feedback geldiğinde, öneri belirsiz/şüpheli görünüyorsa |
| **Invoke** | `superpowers:receiving-code-review` |

---

### 4. Superpowers: Git & Workflow

#### 4.1 using-git-worktrees
| Alan | Açıklama |
|------|----------|
| **Ne Yapar** | İzole çalışma alanı oluşturma, güvenli dizin seçimi |
| **Ne Zaman** | Paralel feature geliştirme, mevcut çalışmayı bozmadan deneme |
| **Invoke** | `superpowers:using-git-worktrees` |

#### 4.2 finishing-a-development-branch
| Alan | Açıklama |
|------|----------|
| **Ne Yapar** | Branch'i tamamlama seçenekleri (merge/PR/cleanup) |
| **Ne Zaman** | İmplementasyon bitti, testler geçiyor, entegrasyon zamanı |
| **Invoke** | `superpowers:finishing-a-development-branch` |

---

### 5. Superpowers: Paralel Çalışma

#### 5.1 dispatching-parallel-agents
| Alan | Açıklama |
|------|----------|
| **Ne Yapar** | Bağımsız görevleri paralel agent'larla çalıştırma |
| **Ne Zaman** | 2+ bağımsız görev, shared state yok, sequential bağımlılık yok |
| **Invoke** | `superpowers:dispatching-parallel-agents` |

#### 5.2 subagent-driven-development
| Alan | Açıklama |
|------|----------|
| **Ne Yapar** | Aynı session'da paralel agent ile implementasyon |
| **Ne Zaman** | Plan var, görevler bağımsız, aynı oturumda çalışılacak |
| **Invoke** | `superpowers:subagent-driven-development` |

---

### 6. Superpowers: Meta

#### 6.1 using-superpowers
| Alan | Açıklama |
|------|----------|
| **Ne Yapar** | Skill sistemini tanıtır, nasıl kullanılacağını açıklar |
| **Ne Zaman** | Her konuşma başlangıcında (otomatik yüklenir) |
| **Invoke** | `superpowers:using-superpowers` |

#### 6.2 writing-skills
| Alan | Açıklama |
|------|----------|
| **Ne Yapar** | Yeni skill oluşturma/düzenleme, deploy öncesi doğrulama |
| **Ne Zaman** | Custom skill yazmak, mevcut skill güncellemek istediğinde |
| **Invoke** | `superpowers:writing-skills` |

---

### 7. Tasarım Skill'leri

#### 7.1 frontend-design
| Alan | Açıklama |
|------|----------|
| **Ne Yapar** | Production-grade, distinctive UI oluşturma |
| **Ne Zaman** | Web component, sayfa, uygulama tasarımı |
| **Invoke** | `frontend-design:frontend-design` |

#### 7.2 canvas-design
| Alan | Açıklama |
|------|----------|
| **Ne Yapar** | Görsel tasarım (.png/.pdf), design philosophy |
| **Ne Zaman** | Poster, afiş, statik görsel, sanat çalışması |
| **Invoke** | `canvas-design` |

---

### 8. Yardımcı Skill'ler

#### 8.1 skill-writer
| Alan | Açıklama |
|------|----------|
| **Ne Yapar** | SKILL.md dosyası oluşturma rehberi, frontmatter, yapı |
| **Ne Zaman** | Yeni skill yazarken, skill yapısını öğrenmek istediğinde |
| **Invoke** | `skill-writer` |

---

<!--
### 9. [Yeni Kategori Adı]

#### 9.1 [skill-adi]
| Alan | Açıklama |
|------|----------|
| **Ne Yapar** | [Açıklama] |
| **Ne Zaman** | [Kullanım durumu] |
| **Invoke** | `[invoke-komutu]` |
| **Tip** | [Opsiyonel: Rigid/Flexible] |

-->

---

## Karar Akışı

```
1. Görev geldi
   ↓
2. Risk/karmaşıklık değerlendir
   ↓
3. YÜKSEK → Hangi aşama?
   │
   ├─ Başlangıç/Belirsiz → 1.1 brainstorming
   ├─ Plan gerekli → 1.2 writing-plans
   ├─ Bug/hata → 2.2 systematic-debugging
   ├─ Tamamlandı → 2.3 verification-before-completion
   ├─ Review isteme → 3.1 requesting-code-review
   └─ Merge zamanı → 4.2 finishing-a-development-branch
   ↓
4. DÜŞÜK → Direkt yap
```

---

## Hızlı Referans Tablosu

| # | Skill | Anahtar Kelime |
|---|-------|----------------|
| 1.1 | brainstorming | yeni özellik, belirsiz, alternatif |
| 1.2 | writing-plans | çok adım, karmaşık, plan |
| 1.3 | executing-plans | plan uygulama, parçalı |
| 2.1 | test-driven-development | test, TDD, kritik logic |
| 2.2 | systematic-debugging | bug, hata, beklenmeyen |
| 2.3 | verification-before-completion | commit, deploy, doğrula |
| 3.1 | requesting-code-review | review, inceleme, merge öncesi |
| 3.2 | receiving-code-review | feedback, öneri, değerlendir |
| 4.1 | using-git-worktrees | izole, paralel branch |
| 4.2 | finishing-a-development-branch | merge, PR, cleanup |
| 5.1 | dispatching-parallel-agents | paralel, bağımsız görev |
| 5.2 | subagent-driven-development | aynı session, paralel |
| 6.1 | using-superpowers | başlangıç, otomatik |
| 6.2 | writing-skills | skill yaz, düzenle |
| 7.1 | frontend-design | UI, component, sayfa |
| 7.2 | canvas-design | görsel, poster, tasarım |
| 8.1 | skill-writer | yeni skill, SKILL.md |

---

## Kırmızı Bayraklar

| Düşünce | Gerçek |
|---------|--------|
| "Basit bir iş" | Basit işler karmaşıklaşır |
| "Önce biraz bakayım" | Skill NASIL bakacağını söyler |
| "Hızlıca hallederim" | Acele hata getirir |
| "Bu skill çok formal" | Disiplin kalite getirir |
| "Zaten biliyorum ne yapacağımı" | Bilmek ≠ Doğru yapmak |

---

## Yeni Skill Ekleme Şablonu

```markdown
### [Kategori No]. [Kategori Adı]

#### [Kategori No].[Sıra No] [skill-adi]
| Alan | Açıklama |
|------|----------|
| **Ne Yapar** | [Skill'in yaptığı iş] |
| **Ne Zaman** | [Kullanım senaryoları] |
| **Invoke** | `[invoke-komutu]` |
| **Tip** | [Opsiyonel: Rigid/Flexible] |
```

**Ekleme sonrası:**
1. Toplam Skill sayısını güncelle
2. Hızlı Referans Tablosuna ekle
3. Karar Akışına uygunsa ekle

---

## Notlar

- Skill invoke etmek → içeriği okumak, takip etmek zorunlu değil
- %1 ihtimal bile varsa invoke et, uygun değilse bırak
- **Rigid** skill'ler (TDD, debugging): Harfiyen uygula
- **Flexible** skill'ler (patterns): Bağlama adapte et
