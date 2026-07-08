import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@coreModule/components/ui/button.tsx'
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@coreModule/components/ui/form.tsx'
import { RadioGroup, RadioGroupItem } from '@coreModule/components/ui/radio-group.tsx'
import { Switch } from '@coreModule/components/ui/switch.tsx'
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {
    ContentSection
} from "@coreModule/clients/panel/private/accountSettings/components/content-section.tsx";

const notificationsFormSchema = z.object({
    type: z.enum(['all', 'mentions', 'none'], {
        error: (iss) =>
            iss.input === undefined
                ? 'Please select a notification type.'
                : undefined,
    }),
    mobile: z.boolean().default(false).optional(),
    communication_emails: z.boolean().default(false).optional(),
    social_emails: z.boolean().default(false).optional(),
    marketing_emails: z.boolean().default(false).optional(),
    security_emails: z.boolean(),
})

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>

// This can come from your database or API.
const defaultValues: Partial<NotificationsFormValues> = {
    communication_emails: false,
    marketing_emails: false,
    social_emails: true,
    security_emails: true,
}

type NotificationsProps = WithLanguageType & {}

function NotificationsForm({
    resolveLanguageKey
}: NotificationsProps) {

    const form = useForm<NotificationsFormValues>({
        resolver: zodResolver(notificationsFormSchema),
        defaultValues,
    })

    return (
        <ContentSection
            title={resolveLanguageKey("title")}
            desc={resolveLanguageKey("description")}
        >
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(() => {})}
                    className='space-y-8'
                >
                    <FormField
                        control={form.control}
                        name='type'
                        render={({ field }) => (
                            <FormItem className='relative space-y-3'>
                                <FormLabel>{resolveLanguageKey("notifyAbout.title")}</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className='flex flex-col gap-2'
                                    >
                                        <FormItem className='flex items-center'>
                                            <FormControl>
                                                <RadioGroupItem value='all' />
                                            </FormControl>
                                            <FormLabel className='font-normal'>
                                                {resolveLanguageKey("notifyAbout.all")}
                                            </FormLabel>
                                        </FormItem>
                                        <FormItem className='flex items-center'>
                                            <FormControl>
                                                <RadioGroupItem value='mentions' />
                                            </FormControl>
                                            <FormLabel className='font-normal'>
                                                {resolveLanguageKey("notifyAbout.direct")}
                                            </FormLabel>
                                        </FormItem>
                                        <FormItem className='flex items-center'>
                                            <FormControl>
                                                <RadioGroupItem value='none' />
                                            </FormControl>
                                            <FormLabel className='font-normal'>{resolveLanguageKey("notifyAbout.nothing")}</FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className='relative'>
                        <h3 className='mb-4 text-lg font-medium'>{resolveLanguageKey("emailNotifications.title")}</h3>
                        <div className='space-y-4'>
                            <FormField
                                control={form.control}
                                name='communication_emails'
                                render={({ field }) => (
                                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                                        <div className='space-y-0.5'>
                                            <FormLabel className='text-base'>
                                                {resolveLanguageKey("emailNotifications.communication.title")}
                                            </FormLabel>
                                            <FormDescription>
                                                {resolveLanguageKey("emailNotifications.communication.description")}
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name='marketing_emails'
                                render={({ field }) => (
                                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                                        <div className='space-y-0.5'>
                                            <FormLabel className='text-base'>
                                                {resolveLanguageKey("emailNotifications.marketing.title")}
                                            </FormLabel>
                                            <FormDescription>
                                                {resolveLanguageKey("emailNotifications.marketing.description")}
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name='security_emails'
                                render={({ field }) => (
                                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                                        <div className='space-y-0.5'>
                                            <FormLabel className='text-base'>
                                                {resolveLanguageKey("emailNotifications.security.title")}
                                            </FormLabel>
                                            <FormDescription>
                                                {resolveLanguageKey("emailNotifications.security.description")}
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled
                                                aria-readonly
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                    <Button type='submit'>{resolveLanguageKey("update")}</Button>
                </form>
            </Form>
        </ContentSection>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/notifications/index.tsx")
)(NotificationsForm)