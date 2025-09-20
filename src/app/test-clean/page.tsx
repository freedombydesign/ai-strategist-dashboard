export default function TestClean() {
  return (
    <div>
      <h1>TEST CLEAN PAGE</h1>
      <p>This page should have NO error suppression scripts</p>
      <script
        dangerouslySetInnerHTML={{
          __html: `console.log('TEST CLEAN PAGE LOADED - checking for error suppression');`
        }}
      />
    </div>
  )
}