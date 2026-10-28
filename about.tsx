"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MoveRight, ShieldCheck, Trash2, Check } from "lucide-react";
import { Header, Footer, Modal } from "./ui";
import { api } from "@/lib/client";
export default function About() {
  const [confirm, setConfirm] = useState(false),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  function clearDraft() {
    try {
      localStorage.removeItem("sl_draft");
      sessionStorage.removeItem("sl_adult");
      setStatus("已清除这台浏览器中的问卷草稿与成年确认。已生成的档案仍保留。");
    } catch {
      setStatus("浏览器不允许访问本地存储，请在网站数据设置中手动清除。");
    }
  }
  async function clearAll() {
    setBusy(true);
    try {
      await api("/api/results", { method: "DELETE" });
      try {
        localStorage.removeItem("sl_draft");
        localStorage.removeItem("sl_last_result");
        sessionStorage.removeItem("sl_adult");
      } catch {}
      setStatus("已删除此浏览器会话创建的全部结果与分享链接，并清除本机草稿。");
      setConfirm(false);
    } catch (e) {
      setStatus((e as Error).message);
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header />
      <main className="about-page page-width">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} />
          返回实验室
        </Link>
        <div className="about-intro">
          <div className="eyebrow">ROMANTIC, WITH REASON</div>
          <h1>关于这场温柔的小实验。</h1>
          <p>
            把想象写得具体，也把边界说得清楚。
            <br />
            Soulmate Lab 是面向成年人的娱乐与自我探索工具。
          </p>
        </div>
        <section className="about-section">
          <h2>我们在生成什么</h2>
          <p>
            基于你选择的关系偏好，用本地规则创建一个虚构的成年人物，并从固定图库匹配肖像。姓名、经历、职业、收入、故事和图像都是模拟设定；这不是现实婚恋匹配、专业心理诊断或未来预测。
          </p>
          <p>
            当前版本为 M1
            本地图库版。文字由确定性规则和模板组合，图片来自预先制作的 60 张 AI
            合成肖像图库，均为虚构成年人物，非真人照片。网站运行时不调用文字或生图模型。没有注册、付费、真实聊天或真人推荐。
          </p>
        </section>
        <section className="about-section" id="scoring">
          <h2>一份可解释的偏好评分</h2>
          <p>
            问卷分成「用户特征」「伴侣偏好」「人物生成约束」三层。年龄与呈现偏好用于限制成年人物设定；性格、关系期待和日常习惯用于选择与细化角色模板。
          </p>
          <table className="weight-table">
            <thead>
              <tr>
                <th>维度</th>
                <th>基准权重</th>
                <th>参考内容</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["关系价值观", "30%", "关系目标、个人边界与重大选择"],
                ["沟通与冲突", "25%", "情绪表达、支持方式、修复习惯"],
                ["生活方式", "20%", "社交、兴趣、作息、旅行"],
                ["现实条件", "15%", "宽泛城市偏好、职业阶段"],
                ["审美偏好", "10%", "气质与穿搭，不给人的颜值评分"],
              ].map((r) => (
                <tr key={r[0]}>
                  {r.map((t) => (
                    <td key={t}>{t}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            总分 = 四舍五入（各维度得分 × 实际权重之和）。第 6
            题的外貌重视程度会让审美权重在约 7.3%–12.7%
            之间调整，其他权重按比例缩放；跳过则用 10%。
          </p>
          <p>
            维度分数衡量模板与回答的规则吻合程度。跳过的题目采用默认值，解释部分只引用实际回答。作答越少，个人化程度越有限。所有权重与分数均为产品假设，未经临床或大样本心理学验证，不能理解为现实恋爱成功率。
          </p>
        </section>
        <section className="about-section" id="privacy">
          <h2>你的数据，留在哪里</h2>
          <div className="privacy-grid">
            <div>
              <h3>问卷草稿</h3>
              <p>
                只保存在当前浏览器的本地存储中，刷新后可以继续；不上传原始草稿。生成时将选项发送到这台电脑的本地服务，服务不持久保存原始问卷。
              </p>
            </div>
            <div>
              <h3>生成的人物</h3>
              <p>
                人物档案和必要的偏好特征存储在本机项目 data/results.json，30
                天后在下一次访问时清理。人物结果中的解释可能引用部分偏好，删除时一起移除。
              </p>
            </div>
            <div>
              <h3>匿名分享</h3>
              <p>
                仅主动点击分享或制作海报时创建随机链接，展示精简人物卡。不公开答案、偏好特征、评分解释或昵称。M1
                链接只在本机使用。
              </p>
            </div>
            <div>
              <h3>体验时没有第三方传输</h3>
              <p>
                M1
                不调用外部模型，也不使用埋点、追踪器或远程字体。预制肖像只作为本地静态素材加载。海报在浏览器生成，昵称只用于当前海报。没有任何付费
                API 调用。
              </p>
            </div>
          </div>
          <p>
            为了找回本机结果，浏览器会保存一个随机匿名会话 Cookie，有效期 30
            天。它不包含姓名或联系方式。请勿在昵称等位置填写身份证、手机号或其他隐私信息。
          </p>
          <h3>图片如何匹配</h3>
          <p>
            图库共 60 张，覆盖男性、女性、中性呈现与 5
            个成年年龄段，每组有清爽自然、干练知性、阳光活力、文艺温柔 4
            类气质。先按性别与年龄筛选，再按气质优先、兼顾穿搭评分；相同答案稳定选择同一素材。图库有限，不同用户可能看到相同肖像，未匹配的偏好不作已满足的承诺。
          </p>
          <Link className="text-link" href="/library">
            浏览全部 60 张肖像
            <MoveRight size={14} />
          </Link>
          <h3>清理与删除</h3>
          <p>
            你可以在结果页删除单份档案，也可以在下方清除本浏览器创建的全部结果。删除结果后，对应匿名分享立即失效。已下载的图片需由你在设备中自行删除。
          </p>
          <div className="data-actions">
            <button className="button secondary" onClick={clearDraft}>
              清除问卷草稿
            </button>
            <button
              className="button secondary"
              onClick={() => setConfirm(true)}
            >
              <Trash2 size={15} />
              删除我的全部结果
            </button>
          </div>
          {status && (
            <p role="status" className="data-status">
              {status}
            </p>
          )}
          <small>
            若清除 Cookie
            或更换浏览器，将失去原有匿名会话的管理权限。当前单机原型也可由设备所有者在关闭服务后删除项目
            data 文件夹，移除本机所有结果。
          </small>
        </section>
        <section className="about-section">
          <h2>使用边界与反馈</h2>
          <ul>
            <li>
              只为年满 18 周岁的用户创建成年虚构人物，不接收真实第三方照片。
            </li>
            <li>
              不通过收入、学历、性别或外貌给人分级，不承诺未来伴侣的真实身份或出现时间。
            </li>
            <li>
              人物可能与你的期待有差异。将它视为帮助你整理偏好的创作，而非必须遵循的关系标准。
            </li>
            <li>
              这是未公开部署的本地体验版。若你发现文字、交互或逻辑问题，可在当前对话中告诉开发者；反馈邮箱将在运营主体确定后配置。
            </li>
          </ul>
          <div className="about-footer">
            <ShieldCheck size={18} strokeWidth={1.3} />
            仅监听本机地址 · 无付费接口 · 无公开部署
          </div>
        </section>
        <Link href="/questionnaire" className="button primary">
          准备好了，开始我的实验
          <MoveRight size={18} />
        </Link>
      </main>
      <Footer />
      {confirm && (
        <Modal title="删除全部本机结果" onClose={() => setConfirm(false)}>
          <h2>清空这次实验的足迹？</h2>
          <p>
            这会删除此浏览器匿名会话创建的所有结果、分享链接和问卷草稿。已下载海报不会受影响。
          </p>
          <button
            className="button danger full"
            disabled={busy}
            onClick={clearAll}
          >
            {busy ? "正在删除…" : "确认删除全部结果"}
          </button>
          <button
            className="button secondary full"
            onClick={() => setConfirm(false)}
          >
            保留我的结果
          </button>
        </Modal>
      )}
    </>
  );
}
