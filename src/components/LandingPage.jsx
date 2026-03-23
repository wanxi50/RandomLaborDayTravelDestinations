/**
 * 落地页 - 欢迎页面
 * 展示文案用第一人称（男朋友口吻），操作引导用第二人称
 */
export default function LandingPage({ onStart }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center animate-fade-in-up max-w-md">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 tracking-wide">
          我们的五一旅行
        </h1>

        <p className="text-lg text-gray-500 mb-2">我想带你去一个特别的地方</p>
        <p className="text-base text-gray-400 mb-10">但是去哪里，让命运来决定吧</p>

        <button
          onClick={onStart}
          className="px-8 py-3 bg-pink-400 hover:bg-pink-500 active:bg-pink-600 text-white rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
        >
          来转一转吧
        </button>

        <p className="mt-12 text-sm text-gray-300">
          这是我给你准备的五一小惊喜
        </p>
      </div>
    </div>
  );
}
