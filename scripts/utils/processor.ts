type PipelineSteps = Record<string, () => void | Promise<void>>
type PipelineConfig = Record<keyof PipelineSteps, () => void | Promise<void>>


async function processPipeline(steps: PipelineSteps) {
    const stepsNames = Object.keys(steps)
    const stepArgs: Record<string, any>[] = []

    let i = 0
    
    async function process() {
        const stepsName = stepsNames[i]
        const stepAction = steps[stepsName]


    }

    const step = steps[index]

    try {
        await step()
        index++
        console.log(cookieStore);

        if (index === steps.length) {
            return
        }
        await processPipeline(steps)

    } catch (error) {

        console.log('CAUGHT');
        console.log(error);


        retryCount++
        if (retryCount === 5) {
            throw new Error("Could Not Complete Pipeline Processign");
        }

        await new Promise<void>((resolve) => {
            setTimeout(async () => {
                await processPipeline(steps)
                resolve()
            }, 5000);
        })
    }
}
export { PipelineConfig, PipelineSteps, processPipeline }